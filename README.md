this was a US-based fintech-style backend authentication and session management project. The main requirement from the client was to build a highly secure, scalable authentication architecture similar to what modern fintech applications use.

The client specifically wanted:

* secure authentication
* single-device session handling
* token lifecycle management
* OTP verification
* protection against web attacks
* Redis optimization
* scalable session control

So before writing business logic, I first designed the complete authentication architecture and security flow.

The tech stack I used was:

* Node.js
* Express.js
* MongoDB with Mongoose
* Redis
* JWT
* bcrypt
* Zod
* Nodemailer

The entry point of the project was index.js.

Inside index.js:

* first I loaded environment variables using dotenv
* then initialized Express
* then connected MongoDB
* then connected Redis
* after that I applied middlewares like:

  * express.json()
  * cookieParser()
  * cors()

Then I mounted:

* /api/auth routes
* /api/user routes

One important architectural decision I took was:
MongoDB was treated as a critical dependency.

So if MongoDB connection failed:

* server startup itself failed.

Because without database persistence the application could not function properly.

But Redis was treated as a non-critical dependency.
If Redis failed:

* the server still started
* and Redis errors were logged separately.

This improved fault tolerance and stability.

Then I designed the authentication system.

Initially I implemented JWT-based authentication.

JWT stands for JSON Web Token.

JWT has three parts:

1. Header
2. Payload
3. Signature

Normally in many applications only userId is stored inside JWT payload.

But the problem with normal JWT is:
JWT is stateless.

Meaning:
once token is issued,
backend trusts it until expiry.

This creates problems in fintech systems because:

* instant logout becomes difficult
* single-device login becomes difficult
* session invalidation becomes difficult

So I enhanced JWT using Redis-backed session management.

Whenever the user logged in:

* I generated a unique sessionId using crypto.randomBytes()
* then stored that sessionId:

  * inside JWT payload
  * and inside Redis

Redis key looked like:
active_session:{userId}

Now every protected request followed this flow:

First:

* access token was extracted from cookies

Then:

* JWT signature was verified

After that:

* sessionId inside JWT was compared with Redis sessionId

If both matched:

* request was authenticated

Otherwise:

* request was rejected
* cookies were cleared
* user was logged out

This allowed me to implement:

* single-device login
* instant session invalidation
* secure logout handling

For example:
If the same user logged in from another device:

* a new sessionId was generated
* Redis overwrote the old sessionId

Now the previous device still had a valid JWT technically,
but its sessionId no longer matched Redis.

So middleware immediately rejected old sessions.

This was one of the most important fintech-level security implementations in the project.

Then I implemented Access Token and Refresh Token architecture.

Access Token:

* short-lived
* 15 minutes expiry
* used on protected routes

Refresh Token:

* long-lived
* 7 days expiry
* used to generate new access tokens

This improved both:

* security
* user experience

Because if access token gets stolen:
damage window remains very small.

And users do not need to login repeatedly because refresh token silently regenerates access tokens.

Then I implemented OTP-based login verification.

The client wanted additional login verification beyond passwords.

So login flow became:

Step 1:
User enters:

* email
* password

Step 2:
Backend validates credentials using bcrypt.compare()

Step 3:
Backend generates 6-digit OTP

Step 4:
OTP gets stored inside Redis for 5 minutes

Step 5:
OTP is sent through email using Nodemailer SMTP

Step 6:
User submits OTP

Step 7:
Only after OTP verification:

* JWT tokens
* sessionId
* CSRF token
  were generated

This created two-layer authentication:

* something user knows → password
* something user owns → email access

Then I implemented Email Verification flow during registration.

Instead of directly creating users inside MongoDB:

* temporary user data was first stored inside Redis

Then:

* verification link was emailed

Only after clicking verification link:

* actual MongoDB user creation happened

This prevented fake or unverified accounts from polluting the database.

Then I implemented Redis caching.

The reason was:
I did not want MongoDB to be queried repeatedly on every request.

Inside authentication middleware:

* after JWT verification
* backend first checked Redis cache

If user cache existed:

* request continued immediately

If cache missed:

* user fetched from MongoDB
* then cached inside Redis

This significantly reduced database load and improved response speed.

Then I implemented Rate Limiting.

This was mainly to prevent:

* brute force attacks
* OTP spam
* registration abuse

I created Redis-based keys like:

register-rate-limit:{ip}:{email}

and

login-rate-limit:{ip}:{email}

If too many requests came within short time:
backend returned:
HTTP 429 Too Many Requests

This protected authentication APIs from abuse.

Then I implemented CSRF Protection.

CSRF stands for:
Cross Site Request Forgery.

The problem occurs because browsers automatically attach cookies with requests.

Suppose:

* user already logged in
* attacker tricks user into opening malicious website

That malicious website can secretly send requests to backend.

Since browser automatically sends authentication cookies:
backend may think request is valid.

This is dangerous in fintech systems because attackers can trigger:

* transactions
* password changes
* sensitive operations

So I implemented CSRF protection using Double Submit Token Strategy.

Whenever user logged in:

* backend generated random CSRF token
* stored it inside Redis
* also sent it to frontend as cookie

Frontend then:

* read the token
* attached it inside x-csrf-token header

On protected POST/PUT/DELETE routes:
backend compared:

* header token
* Redis token

Only matching requests were allowed.

This worked because:
attacker websites can force cookies to be sent automatically,
but cannot read CSRF token from frontend JavaScript due to Same-Origin Policy.

Then I implemented secure password hashing using bcrypt.

Passwords were never stored in plain text.

Before saving:
bcrypt.hash(password, saltRounds)

During login:
bcrypt.compare()

This protected credentials even if database leaked.

Then I implemented Zod Validation.

Every request body was validated before processing.

Validation included:

* email format
* password complexity
* required fields
* input constraints

I used safeParse() because it returns structured validation responses instead of crashing the application.

Then I implemented Mongo Sanitization.

Attackers sometimes send malicious Mongo operators like:

* $gt
* $where

to manipulate MongoDB queries.

So before validation:
I sanitized all request bodies using express-mongo-sanitize.

This prevented NoSQL Injection attacks.

I also implemented:

* role-based access control
* admin authorization middleware
* session activity tracking
* refresh token verification
* secure HTTP-only cookies
* Redis session expiry management
* middleware-based architecture
* centralized async error handling using TryCatch wrapper

Overall, the entire architecture was designed keeping:

* security
* scalability
* session lifecycle management
* attack prevention
* performance optimization
* fintech-grade authentication patterns

as the primary focus.

This project gave me strong practical experience in:

* backend system design
* authentication architecture
* Redis optimization
* secure session management
* API protection
* and production-level security engineering.
