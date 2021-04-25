Sign-up use case: 
When the user press on the create a new account button, we bring them to the sign-up screen, with 5 fields: 
Fullname
Username - has to be unique, we will check against our db for availability
Email
Password
Confirm password
The user can login to their streaming account, input their favorite songs, and customize their profile after signing up.
*IDEA* When making a new account, the user can also log-in with a google/facebook account
Flow: sign-up
We validate all inputs:
Full name: how many individual strings do we have? Does it contain special characters? We should only allow latin characters for full names.
Username: only letters and numbers, usernames needs to be unique, we will have a check availability button or status for the user to check if a username has already been taken. Caps matter. 
Email: will send confirmation email, needs to be unique.
Password: only contains letters, numbers and special characters (ASCII characters)
Confirm password: same as password
IF all fields are validated, then we create an account. Create user profile (object) [“Fullname”, “Username”, “Email”, “Password”]. IF not all fields are validated, then have the user re-enter the fields

