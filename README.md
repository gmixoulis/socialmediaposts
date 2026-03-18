# social posts manager

hey so this is a full stack web app i built for managing posts. 

## how to run the project

if u want to use docker (easiest way):
just open a terminal here and run:
`docker compose up -d --build`
this spins up the database and the backend on port 5000. then for the frontend, go to the main folder and run `pnpm i` and `pnpm dev` (it runs on 5173 usually). 

if u DONT want docker:
1. go to `backend1`, run `npm i` then `npm run dev`.
2. open another terminal here, run `pnpm i` then `pnpm dev`.

---

## tech stack & design decisions
- **frontend:** react + typescript + vite + tailwind. i decided to use `@tanstack/react-query` to fetch data cuz it caches things and makes the UI update instantly without waiting for the server.
- **backend:** node.js with hono. hono is basically like express but way faster and has better typescript support out of the box.
- **database:** just sqlite saved locally in `dev.db` so u dont need to set up a whole postgres server. 
- **orm (drizzle):** used drizzle instead of raw sql so i dont mess up the queries and everything is typed. 
- **auto-seeding:** when the backend starts it automatically hits jsonplaceholder to download 100 posts to the db.

## bonus features implemented
1. **search:** the get posts api has a `?search=` param that actually searches through titles and bodies.
2. **pagination:** the db doesnt load all posts at once so it doesnt crash or lag.
3. **better ui:** used tailwind for a clean look, added animations, and made a dedicated page just to see posts u liked.
4. **testing:** there is an automated test suite in the backend folder. just run `npm test` there.

## code quality
tried to keep it organized into folders like `routes`, `db`, and `components` following MVC patterns. left some variable names and console logs a bit casual but the actual structure is clean.
