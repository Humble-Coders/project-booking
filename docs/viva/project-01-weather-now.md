# Viva: Project 01, Weather Now

**API:** OpenWeatherMap (https://openweathermap.org/api) · **Key:** Free API key
**Brief:** Enter a city and show temperature, conditions and a weather icon.

> 30 questions, roughly easy to hard. Sections A and B are common ground for every
> project; C and D are specific to this one. Ask 8 to 12 in a typical 10 minute viva.

## A. Kotlin and Android basics

1. What is the difference between `val` and `var`, and which did you use for your Retrofit instance?
2. What is a data class, and what does Kotlin generate for you when you declare one?
3. Why is your API response modelled as a data class rather than a `Map<String, Any>`?
4. What does the `?` mean in `val temp: Double?`, and where in your weather response is a field genuinely optional?
5. Which Android component holds your screen state, and what happens to that state when the device rotates?
6. What is the difference between `Activity` and `Fragment`, and which did you use here?
7. Where do you declare the INTERNET permission, and what happens if you forget it?

## B. Retrofit, coroutines and networking

8. What problem does Retrofit solve that `HttpURLConnection` does not?
9. Explain the role of the converter factory in your Retrofit builder.
10. What does the `@GET` annotation do, and how does `@Query` differ from `@Path`?
11. Why is your API call function marked `suspend`?
12. What is the difference between `Dispatchers.IO` and `Dispatchers.Main`, and which one runs your network call?
13. What happens on the UI if you call the API directly on the main thread?
14. What is a coroutine scope, and which scope did you launch your call from?
15. How do you distinguish a network failure from an HTTP 404 in your code?

## C. The OpenWeatherMap API and this app

16. What is the exact endpoint you call, and which query parameters does it require?
17. Your API key is a secret. Where is it stored in your project, and why should it not be committed to Git?
18. OpenWeatherMap returns temperature in Kelvin by default. How did you get Celsius?
19. Walk me through the JSON response for a city search. Which fields did you actually use?
20. The `weather` field in the response is an array. Why an array, and which element do you display?
21. How do you turn the icon code in the response into an image on screen?
22. What does the API return when the city name does not exist, and how does your app react?
23. What is the rate limit on the free tier, and what would happen to your app if you exceeded it?
24. If a user types "delhi" in lowercase, does the API still work? Why?

## D. Edge cases, design and extensions

25. What does your app show while the request is in flight?
26. A user is on a plane with no connection and taps search. Describe exactly what they see.
27. What happens if the user taps search five times quickly? Do you cancel the earlier calls?
28. How would you cache the last successful result so the app opens with data offline?
29. How would you add a five day forecast? Which endpoint and what would change in your model classes?
30. If you had to support searching by GPS location instead of city name, what would you change?
