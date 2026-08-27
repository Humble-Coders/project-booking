# Viva: Project 12, GitHub Profile Finder

**API:** GitHub REST API (https://docs.github.com/en/rest) · **Key:** No key needed
**Brief:** Enter a username and show avatar, bio, followers and repositories.

> 30 questions, roughly easy to hard. Sections A and B are common ground for every
> project; C and D are specific to this one. Ask 8 to 12 in a typical 10 minute viva.

## A. Kotlin and Android basics

1. What is the difference between `val` and `var`, and which did you use for your Retrofit instance?
2. What is a data class, and what does Kotlin generate for you?
3. How did you model the user versus a repository, and why are they separate types?
4. What does `?` mean on a property, and which profile fields are genuinely optional?
5. How do you pass the username between screens?
6. How does a RecyclerView adapter know what to draw for each repo row?
7. Where do you declare the INTERNET permission, and what happens if you forget it?

## B. Retrofit, coroutines and networking

8. What problem does Retrofit solve for you?
9. Explain the role of the converter factory in your Retrofit builder.
10. The username sits in the path. Which annotation did you use, and what is the final URL?
11. Why is your API call function marked `suspend`?
12. Which dispatcher runs the network call, and which updates the UI?
13. You need the profile and the repo list. Did you fetch them sequentially or in parallel, and how?
14. What is a coroutine scope, and which one did you launch from?
15. How do you tell a network failure apart from a username that does not exist?

## C. The GitHub API and this app

16. What are the two endpoints you call, and what does each return?
17. GitHub returns snake_case names like `avatar_url` and `public_repos`. How did you map them?
18. Unauthenticated requests are limited to 60 per hour by IP. How did you discover that limit, and what does your app do when it is hit?
19. Which response headers tell you your remaining quota?
20. How would adding a personal access token change the limit, and why must that token never ship in the APK?
21. What HTTP status does GitHub return for an unknown user, and how do you handle it?
22. The repo list is paginated at 30 by default. How do you get someone's 50 repos?
23. How do you load the avatar, and what shows while it downloads?
24. Fields like `bio`, `company` and `location` are often null. How does your UI handle that?

## D. Edge cases, design and extensions

25. What does your app show while the request is in flight?
26. A user has no connection and searches. Describe exactly what they see.
27. GitHub usernames are case insensitive. Does your app treat "Torvalds" and "torvalds" the same?
28. How would you sort repositories by stars, and can the API do it for you?
29. How would you cache a profile so a repeat search is instant?
30. How would you show a user's contribution graph, given the REST API does not expose it?
