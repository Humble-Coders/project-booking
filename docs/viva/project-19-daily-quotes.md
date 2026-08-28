# Viva: Project 19, Daily Quotes

**API:** ZenQuotes (https://zenquotes.io) · **Key:** No key needed
**Brief:** Random inspirational quote with a share button.

> 30 questions, roughly easy to hard. Sections A and B are common ground for every
> project; C and D are specific to this one. Ask 8 to 12 in a typical 10 minute viva.

## A. Kotlin and Android basics

1. What is the difference between `val` and `var`, and which did you use for your Retrofit instance?
2. What is a data class, and what does Kotlin generate for you?
3. How did you model a quote, and what are its fields?
4. What does `?` mean on a property, and are any quote fields genuinely optional?
5. Which Android component holds the current quote, and what happens on rotation?
6. How does an implicit Intent work, and which one did you use for sharing?
7. Where do you declare the INTERNET permission, and what happens if you forget it?

## B. Retrofit, coroutines and networking

8. What problem does Retrofit solve for you?
9. Explain the role of the converter factory in your Retrofit builder.
10. This endpoint takes no parameters. What does your interface method look like?
11. Why is your API call function marked `suspend`?
12. Which dispatcher runs the network call, and which updates the UI?
13. What happens if you call the API on the main thread?
14. What is a coroutine scope, and which one did you launch from?
15. How do you handle the request failing?

## C. The ZenQuotes API and this app

16. What are the `/random` and `/today` endpoints, and how do they differ?
17. The response is a JSON array containing a single object. Why is that a trap, and how did you model it?
18. What do the fields `q`, `a` and `h` stand for?
19. The `h` field contains pre built HTML. Did you use it, and what are the risks of rendering raw HTML?
20. ZenQuotes limits free callers to 5 requests per 30 seconds per IP. How does that shape your refresh button?
21. What does the API return when you exceed that limit, and how does your app behave?
22. ZenQuotes asks for attribution when you display quotes. Did you include it, and where?
23. Is this API served over HTTPS? Why does that matter for Android?
24. What happens if a very long quote arrives, and how does your layout cope?

## D. Edge cases, design and extensions

25. What does your app show while the quote is loading?
26. A user has no connection and taps refresh. Describe exactly what they see.
27. What stops a user hammering the refresh button past the rate limit?
28. How would you cache a quote so the app opens with content offline?
29. How would you add a daily notification with the quote of the day?
30. How would you render the quote onto an image so users can share it to Instagram?
