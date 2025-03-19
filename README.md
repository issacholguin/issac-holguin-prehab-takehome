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

Curls for testing:
Auth Routes:
/auth/register
curl -X POST http://localhost:3000/auth/register -H "Content-Type: application/json" -d '{"username": "test", "password": "test"}'
