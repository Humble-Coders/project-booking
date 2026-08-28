# Viva: Project 10, News Headlines

**API:** NewsAPI.org (https://newsapi.org) · **Key:** Free API key
**Brief:** Top headlines by category in a list; open the full article on tap.

> 30 questions, roughly easy to hard. Sections A and B are common ground for every
> project; C and D are specific to this one. Ask 8 to 12 in a typical 10 minute viva.

## A. Kotlin and Android basics

1. What is the difference between `val` and `var`, and which did you use for your Retrofit instance?
2. What is a data class, and what does Kotlin generate for you?
3. How did you model an article, and which fields did you leave out?
4. What does `?` mean on a property, and which article fields are genuinely optional?
5. Which Android component holds your screen state, and what happens on rotation?
6. How does a RecyclerView adapter know what to draw for each row?
7. Where do you declare the INTERNET permission, and what happens if you forget it?

## B. Retrofit, coroutines and networking

8. What problem does Retrofit solve for you?
9. Explain the role of the converter factory in your Retrofit builder.
10. Which annotations carry `country`, `category` and your API key?
11. Why is your API call function marked `suspend`?
12. Which dispatcher runs the network call, and which updates the UI?
13. What happens if you call the API on the main thread?
14. What is a coroutine scope, and which one did you launch from?
15. How does your code tell a network failure apart from an empty result set?

## C. The NewsAPI and this app

16. What is the top headlines endpoint, and which parameters did you send?
17. NewsAPI accepts the key as a query parameter or an `X-Api-Key` header. Which did you choose and why?
18. The response has a `status` field. What are its values and do you check it?
19. Many articles have a null `urlToImage` or a null `description`. How does your list survive that?
20. `publishedAt` is an ISO 8601 string. How did you turn it into something readable like "2 hours ago"?
21. Each article has a nested `source` object. How is that modelled in Kotlin?
22. Tapping an article should open the full story. Did you use a WebView or an implicit Intent, and why?
23. The free NewsAPI tier only works from localhost and development, not a released app. What does that mean for shipping this?
24. What is the request limit on the free tier, and what does your app do when it is exceeded?

## D. Edge cases, design and extensions

25. What does your app show while headlines are loading?
26. A user has no connection and opens the app. Describe exactly what they see.
27. How does pull to refresh work, and what state do you reset when it fires?
28. How would you cache the last headlines so the app opens with content offline?
29. How would you add category tabs, and what changes in your request?
30. How would you add a keyword search, and which endpoint would you switch to?
