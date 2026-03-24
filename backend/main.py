from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from google.oauth2 import id_token
from google.auth.transport import requests as grequests
from fastapi import Body
from dotenv import load_dotenv
import os
import httpx
import base64
from database import engine
from models import Base, User, History
from database import SessionLocal
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import datetime, timedelta
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi.responses import JSONResponse

load_dotenv()

try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print("DB not available, skipping...", e)

IS_PROD = os.getenv("ENV") == "prod"
FRONTEND_URL = os.getenv("FRONTEND_URL")

HF_TOKEN = os.getenv("HF_TOKEN")
HF_API_URL = os.getenv("HF_API_URL")

# check if .env not set
if not HF_TOKEN:
    raise Exception("HF_TOKEN not set")


GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
FOLDER = "uploads"

headers = {
    "Authorization": f"Bearer {HF_TOKEN}",
    "Content-Type": "application/octet-stream"
}

app = FastAPI()

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

origins = [FRONTEND_URL]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RateLimitExceeded)
def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"error": "Too many requests"}
    )

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        os.getenv("SECRET_KEY"),
        algorithm=os.getenv("ALGORITHM")
    )
    return encoded_jwt

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=1)  
    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        os.getenv("SECRET_KEY"),
        algorithm=os.getenv("ALGORITHM")
    )

def get_current_user_raw(request: Request, db: Session = Depends(get_db)):

    
    try:
        token = request.cookies.get("access_token")

     
        if not token:

            raise HTTPException(status_code=401)

       
        payload = jwt.decode(
            token,
            os.getenv("SECRET_KEY"),
            algorithms=[os.getenv("ALGORITHM")]
        )

        user_id = payload.get("sub")
        
        

        if user_id is None:
            
            raise HTTPException(status_code=401)

       
        user = db.query(User).filter(User.id == int(user_id)).first()

        


        if user is None:
            raise HTTPException(status_code=401)

        return user

    except JWTError:
        raise HTTPException(status_code=401)
    
def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
):
    return get_current_user_raw(request, db)

@limiter.limit("10/minute")
@app.post("/upload")
async def upload_file(
        request: Request,
        file: UploadFile = File(...),
        db: Session = Depends(get_db)):
    image_bytes = await file.read()
    

    input_base64 = base64.b64encode(image_bytes).decode("utf-8")
    input_image_data = f"data:image/jpeg;base64,{input_base64}"


    user = None

    try:
        db = SessionLocal()
        user = get_current_user_raw(request, db)
        db.close()

    except:
        user = None
 

    if not image_bytes:
        return {
            "name": None,
            "confidence": None,
            "reference_image": None,
            "error": "Empty file"
        }

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            HF_API_URL,
            headers=headers,
            content=image_bytes
        )
        if response.status_code != 200:
            return {
                "name": None,
                "confidence": None,
                "reference_image": None,
                "error": f"AI service unavailable (status {response.status_code})"
            }
        result = response.json()

        

        if isinstance(result, list) and len(result) > 0:
            
            top_result = result[0]
            label = top_result["label"]
            score = top_result["score"]

            PIXABAY_KEY = os.getenv("PIXABAY_KEY")
            pixabay_url = f"https://pixabay.com/api/?key={PIXABAY_KEY}&q={label.replace(' ', '+')}&image_type=photo&per_page=5"

            pix_response = await client.get(pixabay_url)
            pix_data = pix_response.json()

            image_url = None

            if "hits" in pix_data and len(pix_data["hits"]) > 0:
                hits = pix_data["hits"]

                for hit in hits:
                    tags = hit["tags"].lower()
                    if label.lower() in tags:
                        image_url = hit["webformatURL"]
                        break

                if not image_url:
                    image_url = hits[0]["webformatURL"]

            print(image_url)
            image_data = None

            if image_url:
                img_response = await client.get(image_url)
                if img_response.status_code == 200:
                    image_base64 = base64.b64encode(img_response.content).decode("utf-8")
                    image_data = f"data:image/jpeg;base64,{image_base64}"
            

            if user:

                history = History(
                    user_id=user.id,
                    input_image=input_image_data,
                    reference_image=image_data,
                    result=label
                )
                print("added to history for user")
                print(user.id)
                
                db.add(history)
                db.commit()


            return {
                "name": label,
                "confidence": round(score, 3),
                "reference_image": image_data,
                "error": None
            }
        

    return {
    "name": None,
    "confidence": None,
    "reference_image": None,
    "error": "AI did not return valid result"
}

@limiter.limit("5/minute")
@app.post("/auth/google")
async def google_auth(request: Request, data: dict = Body(...), db: Session = Depends(get_db)):
    token = data.get("token")

    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            grequests.Request(),
            GOOGLE_CLIENT_ID
        )

        user = db.query(User).filter(User.google_id == idinfo["sub"]).first()

        if not user:
            user = User(
                email=idinfo["email"],
                name=idinfo.get("name"),
                google_id=idinfo["sub"]
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        access_token = create_access_token( {"sub": str(user.id)} )
        refresh_token = create_refresh_token({"sub": str(user.id)})

        response = Response(content='{"message":"Login successful"}', media_type="application/json")

        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            samesite="none" if IS_PROD else "lax",
            secure=IS_PROD  
        )

        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            samesite="none" if IS_PROD else "lax",
            secure=IS_PROD
        )

        return response

    except Exception as e:
        return {
            "error": "Invalid Google token"
        }

@app.get("/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name
    }

@app.post("/refresh")
def refresh(request: Request):
    token = request.cookies.get("refresh_token")

    if not token:
        raise HTTPException(status_code=401)

    try:
        payload = jwt.decode(
            token,
            os.getenv("SECRET_KEY"),
            algorithms=[os.getenv("ALGORITHM")]
        )

        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(status_code=401)

        new_access = create_access_token({"sub": user_id})

        response = Response(content='{"message":"refreshed"}', media_type="application/json")

        response.set_cookie(
            key="access_token",
            value=new_access,
            httponly=True,
            samesite="none" if IS_PROD else "lax",
            secure=IS_PROD
        )

        return response

    except JWTError:
        response = Response(status_code=401)
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")
        return response

@app.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Logged out"}

@limiter.limit("20/minute")
@app.get("/history")
def get_history(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):

    history = db.query(History).filter(
        History.user_id == current_user.id
    ).all()

    return [
        {
            "id": h.id,
            "input_image": h.input_image,
            "reference_image": h.reference_image,
            "result": h.result
        }
        for h in history
    ]


@app.delete("/history/{history_id}")
def delete_history(history_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = db.query(History).filter(
        History.id == history_id,
        History.user_id == current_user.id
    ).first()

    if not record:
        raise HTTPException(status_code=404)

    db.delete(record)
    db.commit()

    return {"message": "Deleted"}