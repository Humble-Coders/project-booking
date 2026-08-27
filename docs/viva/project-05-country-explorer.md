# Viva: Project 05, Country Explorer

**API:** REST Countries (https://restcountries.com) · **Key:** No key needed
**Brief:** Search any country: flag, capital, population and currency.

> 30 questions, roughly easy to hard. Sections A and B are common ground for every
> project; C and D are specific to this one. Ask 8 to 12 in a typical 10 minute viva.

## A. Kotlin and Android basics

1. What is the difference between `val` and `var`, and which did you use for your Retrofit instance?
2. What is a data class, and what does Kotlin generate for you?
3. How do you declare a list of countries in Kotlin, and what type is each element?
4. What does `?` mean on a property, and which country fields are genuinely optional?
5. Which Android component holds your screen state, and what happens on rotation?
6. How does a RecyclerView adapter know what to draw for each row?
7. Where do you declare the INTERNET permission, and what happens if you forget it?

## B. Retrofit, coroutines and networking

8. What problem does Retrofit solve for you?
9. Explain the role of the converter factory in your Retrofit builder.
10. The country name goes into the path here. Which annotation did you use and why?
11. Why is your API call function marked `suspend`?
12. Which dispatcher runs the network call, and which updates the UI?
13. What happens if you call the API on the main thread?
14. What is a coroutine scope, and which one did you launch from?
15. How do you tell a network failure apart from a country that does not exist?

## C. The REST Countries API and this app

16. What is the exact endpoint for searching by name, and how does it differ from `/all`?
17. The `name` field is an object with `common` and `official`. Which did you show and why?
18. `capital` is an array. Why would a country have more than one, and how do you display it?
19. `currencies` is keyed by currency code, so the key itself is data. How did you model that?
20. `languages` has the same shape problem. How do you turn it into a readable string?
21. The flag comes as a URL. Which library did you use to load it, and why not do it yourself?
22. This API supports a `fields` parameter to trim the response. Why does that matter on mobile?
23. What does the API return for a name that matches nothing, and how does your app react?
24. Searching "in" matches several countries. How does your UI handle multiple matches?

## D. Edge cases, design and extensions

25. What does your app show while the request is in flight?
26. A user has no connection and searches. Describe exactly what they see.
27. The `/all` endpoint returns a large payload. What does that do to load time and memory?
28. How would you cache the country list so the app works offline?
29. How would you add sorting by population or area?
30. How would you show bordering countries, given the API returns only their three letter codes?
