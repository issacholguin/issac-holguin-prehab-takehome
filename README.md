Versions:
Node: 18.20.5
NPM: 10.8.2

To run the project:

1. Clone the repository
2. Run `npm install`
3. Run `npm run dev`

to transpile the TS to JS and run the project:

1. Run `npm install`
2. Run `npm run build`
3. Run `npm run start`

OR if you want to run the dev container:

1. Clone the repository
2. Ensure devcontainers is installed in VSCode as an extension
3. Open the repository in VSCode
4. Run `Dev Containers: Reopen in Container`
5. Once the container is running in the /workspaces/issac-holguin-prehab-takehome directory, refer to top of README for instructions on running or building the project

Instructions for setting up the environment:

1. Run `./setup-env.sh`
   this will create
   .env.local for development
   .env.test for testing
   and add the JWT_SECRET to both files

instructions for running tests:

1. Run `docker compose -f docker-compose.test.yml up --build`

docker compose -f docker-compose.prod.yml up -d --build

Curls for testing:
Auth Routes:
/auth/register
curl -X POST http://localhost:3000/auth/register -H "Content-Type: application/json" -d '{"username": "test", "password": "test"}'

curl -X POST http://localhost:3000/exercises \
-H "Content-Type: application/json" \
-d '{"name": "Pushups", "description": "Pushups are a great exercise for the chest", "difficulty": 1, "isPublic": 1}'

improvements:

setup assumes we want an access + refresh token pair (vs doing some verification of the user/email) but since we only have one field username, it was safe to assume we'd be logged in.

in a real world setting i would opt to dynamically load secrets from a vault like AWS Secrets Manager , but for now we are just using environment variables..

i would also add a lot more tests, ideally integration tests for the auth and user

constants around the messages we send to the client

---

# Prompt:

Build a RESTful API with endpoints that can handle the following requests.

## 1. Using JWT-based authentication:

DONE , /auth/register
a. Create user with the following fields
i. Username  
 ii. Password

DONE , /auth/login
b. Authenticate a user

DONE , /auth/refresh-token
c. Refresh an access token

## 2. An authenticated user can:

a. Create a new exercise with the following properties:
i. Name  
 ii. Description  
 iii. Difficulty level on a scale of 1-5  
 iv. Is public (boolean)  
 b. Modify an exercise’s name, description, and/or difficulty level  
 a public exercise can be modified by an authneticated user
b a non public exercise can only be modified by the user who created it
c. Delete an exercise

## 3. All users can:

a. Retrieve a list of all public exercises  
 i. Can be sorted by the following:

1.  Difficulty level  
    ii. Can be searched/filtered by the following fields:
1.  Name
1.  Description
1.  Difficulty level  
    iii. Include non-public exercises that were created by the user sending the request  
    b. Retrieve a specific exercise  
    i. Not public exercises cannot be retrieved unless the user sending the request is the creator of the exercise being requested

## Bonus points:

1. An authenticated user can  
   a. “Favorite” and “Un-favorite” an exercise  
   b. “Save” and “Un-save” an exercise  
   c. “Rate” an exercise from 1-5  
   d. Retrieve a combined list of the user’s own favorite and saved exercises  
    i. Include a property with each record returned indicating whether the user “saved” and/or “favorited” that specific exercise

2. When retrieving a list of all public exercises (see 2a in Prompt above)  
   a. Also include a count of “saves” or “favorites” for each exercise record returned

3. Retrieve a specific exercise  
   a. Include the following fields:  
    i. Name  
    ii. Description  
    iii. Difficulty level  
    iv. Count of favorites  
    v. Count of saves  
   b. Not public exercises cannot be retrieved unless the user sending the request is the creator of the exercise being requested

4. Retrieve a list of users that have saved or favorited a specific exercise

5. Include unit tests

6. Include API docs

7. Include a way to execute database/schema migrations

8. Create a multi-column database index of your choice
