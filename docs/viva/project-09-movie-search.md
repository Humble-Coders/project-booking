# Viva: Project 09, Movie Search

**API:** OMDb API (https://www.omdbapi.com) · **Key:** Free API key
**Brief:** Search movies and show posters, release year and IMDb rating.

> 30 questions, roughly easy to hard. Sections A and B are common ground for every
> project; C and D are specific to this one. Ask 8 to 12 in a typical 10 minute viva.

## A. Kotlin and Android basics

1. What is the difference between `val` and `var`, and which did you use for your Retrofit instance?
2. What is a data class, and what does Kotlin generate for you?
3. How did you model a search result versus a full movie, and why are they different?
4. What does `?` mean on a property, and which movie fields are genuinely optional?
5. How do you pass the selected movie to the detail screen?
6. How does a RecyclerView adapter know what to draw for each row?
7. Where do you declare the INTERNET permission, and what happens if you forget it?

## B. Retrofit, coroutines and networking

8. What problem does Retrofit solve for you?
9. Explain the role of the converter factory in your Retrofit builder.
10. OMDb takes everything as query parameters, including the key. Which annotation did you use?
11. Why is your API call function marked `suspend`?
12. Which dispatcher runs the network call, and which updates the UI?
13. What happens if you call the API on the main thread?
14. What is a coroutine scope, and which one did you launch from?
15. How do you tell a network failure apart from a film that does not exist?

## C. The OMDb API and this app

16. What is the difference between the `s` parameter and the `t` parameter, and where did you use each?
17. Your API key travels in the URL. Why is that worse than a header, and where is the key stored in your project?
18. OMDb returns HTTP 200 even for an error, with `"Response": "False"`. How does your code detect failure?
19. Field names come back capitalised, like `Title` and `Year`. How did you map them to Kotlin naming?
20. Missing values arrive as the literal string `"N/A"`, not null. Where does that bite you, and how did you handle it?
21. `imdbRating` is a string, not a number. Why, and what did you do about it?
22. The search endpoint returns `totalResults` and pages of 10. How did you handle more than 10 matches?
23. How do you load the poster image, and what happens when `Poster` is `"N/A"`?
24. What is the daily request limit on the free key, and what would your app do if it ran out?

## D. Edge cases, design and extensions

25. What does your app show while the request is in flight?
26. A user has no connection and searches. Describe exactly what they see.
27. Should you search on every keystroke? What is debouncing and would it help?
28. How would you add pagination to load results 11 to 20?
29. How would you add a watchlist that survives app restarts?
30. How would you filter results by type, so only movies and not series appear?
