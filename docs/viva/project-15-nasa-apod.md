# Viva: Project 15, NASA Picture of the Day

**API:** NASA APOD (https://api.nasa.gov) · **Key:** Free API key
**Brief:** Daily space image with its explanation, plus a date picker for past days.

> 30 questions, roughly easy to hard. Sections A and B are common ground for every
> project; C and D are specific to this one. Ask 8 to 12 in a typical 10 minute viva.

## A. Kotlin and Android basics

1. What is the difference between `val` and `var`, and which did you use for your Retrofit instance?
2. What is a data class, and what does Kotlin generate for you?
3. How did you model the APOD response, and which fields did you keep?
4. What does `?` mean on a property, and which APOD fields are genuinely optional?
5. Which Android component holds your screen state, and what happens on rotation?
6. How did you show the date picker, and how do you get the chosen date back?
7. Where do you declare the INTERNET permission, and what happens if you forget it?

## B. Retrofit, coroutines and networking

8. What problem does Retrofit solve for you?
9. Explain the role of the converter factory in your Retrofit builder.
10. Which annotations carry `api_key` and `date`?
11. Why is your API call function marked `suspend`?
12. Which dispatcher runs the network call, and which updates the UI?
13. What happens if you call the API on the main thread?
14. What is a coroutine scope, and which one did you launch from?
15. How do you tell a network failure apart from a date the API rejects?

## C. The NASA APOD API and this app

16. What is the exact endpoint, and what does the URL look like for a specific date?
17. NASA offers `DEMO_KEY`. What are its limits, and why should you register your own?
18. Where is your API key stored, and why must it not be committed to Git?
19. The `media_type` field can be `image` or `video`. What does your app do for a video day?
20. If you ignore `media_type`, what does the user see on a video day?
21. What date format does the API expect, and what happens if you send a different one?
22. APOD began on 16 June 1995. What does the API return for an earlier date, and does your picker prevent it?
23. What happens if the user picks tomorrow's date?
24. `hdurl` and `url` are both present for images. Which did you load and why does it matter on mobile data?

## D. Edge cases, design and extensions

25. What does your app show while the image is downloading?
26. A user has no connection and opens the app. Describe exactly what they see.
27. The explanation text is long. How did you make it readable without pushing the image off screen?
28. How would you cache today's picture so it opens instantly on a second launch?
29. How would you add a share button that sends the image and its title?
30. How would you show a grid of the last seven days, and how many requests would that take?
