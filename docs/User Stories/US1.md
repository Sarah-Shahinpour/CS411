Login use case:
Users will be prompted with a login screen where there will be:
2 textboxes for username & password
sign in button
a button to create a new account
Flow: login (sign-in button clicked) or create a new account (CNA button clicked)
Login-flow: 
Event: sign-in button clicked
Basic flow: when both textboxes are non-empty, we will first check and parse it into our Inputformat, that way if there are any malicious/non-compatible characters we can prompt the user to re-enter the fields without checking with our db. Then we pass it into our db and see if we get a hit, if so, load up the user’s profile, if not, prompt the user to re-enter the fields.
Alternate flow: if either textboxes are empty, then tell the user to re-enter the fields.

