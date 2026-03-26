# Name
WhatIsIt App

## About
This pet project is a web application that lets you upload an image and get some pretty funny and unexpected results from an AI API. 

## WARNING 
This application uses external AI services to generate images. Results may be unpredictable and may include inappropriate content.
Use at your own discretion. Not recommended for users under 18!

## Demo
<img width="189"  alt="Demo_01" src="https://github.com/user-attachments/assets/6498eb34-e434-4575-8b32-afa996da7c1d" />
<img width="189"  alt="Demo_02" src="https://github.com/user-attachments/assets/e3b91a0a-432d-4805-9ffc-da2e0ccfaa19" />
<img width="189"  alt="Demo_05" src="https://github.com/user-attachments/assets/2fe6931b-f5e1-4c75-b784-3141cdccd13a" />
<img width="189"  alt="Demo_03" src="https://github.com/user-attachments/assets/cd5aa442-c016-484f-a532-0462679122b1" />


## How it works
1. User uploads an image,
2. Image is sent to Backend and to AI API,
3. API returns label and confidence,
4. Backend searches reference image via Pixabay,
5. Result is returned to frontend,
6. If user is logged in result is saved to history.

## Limitations
1. AI results may be inaccurate,
2. Depends on external APIs, 
3. Response time depends on external services.

## Tech stack 
React, Vite, Python, FastApi, Uvicorn, PostgreSQL, SQLAlchemy. Hosts: back (Render), front(Vercel)

## Run web
The app is available at: https://app.whatisitapp.site

Due to limitations on free backend hosting, the server goes into sleep mode when inactive and takes about 1 minute to restart. Please keep this in mind.

## Run locally
### 1. Clone repository
```bash
git clone https://github.com/YaroslavPliutin/WhatIsApp.git
cd WhatIsApp
```
### 2. Backend setup (FastAPI)
```bash
cd backend
```
create virtual environment
```bash
python -m venv venv
```
activate (Windows)
```bash
venv\Scripts\activate
```
activate (Mac/Linux)
```bash
source venv/bin/activate
```
install dependencies
```bash
pip install -r requirements.txt
```
create .env file and add your own variables to .env 
```bash
DATABASE_URL= , 
HF_TOKEN=  #(hugging face), 
HF_API_URL= , 
GOOGLE_CLIENT_ID= , 
SECRET_KEY=  #(just random number),
ALGORITHM=  #(your algorithm for JWT),
ACCESS_TOKEN_EXPIRE_MINUTES=  #(e.g. 10),
PIXABAY_KEY= ,
FRONTEND_URL= ,
ENV=  #(dev for tests, prod for deploy)
```
run server
```bash
uvicorn main:app --reload
```
### 3. Frontend setup (React + Vite)
```bash
cd frontend
```
install dependencies
```bash
npm install
```
create .env file and add your own variables to .env 
```bash
VITE_GOOGLE_CLIENT_ID= ,
VITE_API_UR=  #(URL to API)
```
run app
```bash
npm run dev
```
### 4. Open in browser
http://localhost:5173

## Example of use
You can upload a photo of your pet, such as a cat, and get a response saying it’s an Egyptian cat with a picture of a lion. You can try it yourself. During my tests, a kiwi was always identified as a strawberry or a wild strawberry. 

## Architecture decisions
### .env (Back, Front)
Since there are many places in the files where variables need to be changed when replacing an API or a backend reference, and simply for security reasons, I’ve moved many variables to the .env file so that I can quickly change them if necessary. In the case of the backend, the .env file also sets certain internal dependencies in the main.py file based on the value of the ENV variable. For example, to quickly switch the project status from dev to prod.

### Why these specific technologies
I want to note up front that while the tech stack listed below certainly has its place, I deliberately avoided using various AI assistants (such as Claude) unless absolutely necessary, and I also tried to avoid using libraries that would have made things much easier (for example, when writing CSS or React files), because even though this project isn’t the most complex, I wanted to understand the structure and rules of programming at a deep level, so that when I use assistants and libraries in the future, I won’t take them for granted, but will firmly understand exactly what they simplify and why.

***JS, React*** – I believe that React allows you to create impressive dynamic web pages, has potential for mobile development with React Native, and is very popular in the market, which is why I chose it. 

***Python*** – This project does not involve complex financial systems or projects with complex business logic, so I decided that Python would be sufficient. Another factor was that I am simply more familiar with Python. 

***PostgreSQL, FastAPI, SQLAlchemy*** – I wanted to ensure the project’s potential for growth and simulate working on a real-world project with high server load. Due to the excellent multithreading capabilities and stability of the system, as well as its market demand, I chose PostgreSQL and FastAPI. I chose SQLAlchemy because it simplifies database queries, and I thought this would be good practice.

***Hosting*** – Render and Vercel were chosen for quick deployment and ease of setup.

### Authentication via Google 
Google OAuth was implemented to streamline authentication and focus on integration with external services.

### JWT TOKEN
I didn’t want the user’s session to depend solely on the temporary token generated by Google, so I decided to generate my own JWT token and use it to authenticate the user and link them to the database. For greater security, I decided to store the JWT token in cookies, which later led me to purchase a domain so that users could log in on browsers that block cookies from being sent to third-party domains (such as Safari). I also created a primary JWT token and a refresh token so that the backend would know when to refresh the token and extend the session. This allowed users to stay logged in while viewing their image history. 

### Upload route
This route is designed to be as simple and straightforward as possible.

1. I receive the file and immediately read it as bytes. This avoids saving the file to the server and keeps the logic simple by eliminating the need for temporary files.

2. I send the image directly to the AI API. I chose a free service to keep the project simple and avoid paid integrations. The main goal was simply to get a working result

3. I take the AI’s response as-is (label + confidence). 

4. I search for a similar image via Pixabay. This is also a free API. I use the label as a search query, and then simply take the first suitable image, since determining whether an image is appropriate or not would significantly complicate the project.

5. If the user is authorized, I save the history.
I save:
- the original image (base64)
- the found image
- the result (label)

This allows me to display the history later without making repeated API requests.

6. Everything is wrapped in simple checks and fallbacks. 
If something doesn’t work (AI, Pixabay, empty file), I return a clear response without crashing the server.

### Possible improvements to the project
1.  Authentication. The current implementation uses a pop-up window for Google sign-in. This approach does not work in embedded browsers (such as Telegram WebView), where pop-ups are blocked. The best solution I’ve found would be to use a redirect instead of a pop-up.
2.	CSS structure. Currently, all styles are in a single file without being divided into modules. This complicates navigation and making changes. It would be better to divide the styles into logical sections (e.g., components, layout, utilities), which would simplify maintenance and scaling.
3.	Backend structure. The main backend logic is concentrated in a single file, which makes it difficult to understand and develop the project. It would make sense to split the code into separate modules, such as: routes, services (working with AI and Pixabay), and database operations.
4.	Content control. Results obtained from AI and external APIs do not undergo additional filtering. This could lead to the display of inappropriate content. Basic verification or restrictions could be added to make the app safe for a 13+ audience.
5.	Caching. Each request re-queries the AI and Pixabay. Caching (e.g., based on the result or image hash) via Redis can be added to reduce load and speed up responses.
6.	Backend file validation. I implemented file size validation only on the frontend. However, this can be bypassed. I should add file type and size validation on the server.
7.  Error handling. Errors from external services are handled but not structured. I can introduce a uniform response format and categorize error types (e.g., AI error, timeout, invalid response).
8.  Request history. Currently, the entire history is loaded at once. As the amount of data increases, this could lead to performance issues. It would be better to implement pagination or load data in batches.
9.  Token security. Although the current implementation using cookies works, security can be further improved, for example, by adding refresh tokens and invalidating them when the user logs out.

