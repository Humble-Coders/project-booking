# Viva: Project 02, Currency Converter

**API:** Frankfurter (https://frankfurter.dev) · **Key:** No key needed
**Brief:** Convert an amount between currencies using live exchange rates.

> 30 questions, roughly easy to hard. Sections A and B are common ground for every
> project; C and D are specific to this one. Ask 8 to 12 in a typical 10 minute viva.

## A. Kotlin and Android basics

1. What is the difference between `val` and `var`, and which did you use for your Retrofit instance?
2. What is a data class, and what does Kotlin generate for you when you declare one?
3. Why should a currency amount not be stored as `Float`? What did you use instead?
4. What does the safe call operator `?.` do, and where did you need it?
5. Which Android component holds your screen state, and what happens on rotation?
6. How did you populate the currency dropdown, hardcoded list or from the API?
7. Where do you declare the INTERNET permission, and what happens if you forget it?

## B. Retrofit, coroutines and networking

8. What problem does Retrofit solve that writing raw HTTP calls does not?
9. Explain the role of the converter factory in your Retrofit builder.
10. What does `@GET` do, and how does `@Query` differ from `@Path`?
11. Why is your API call function marked `suspend`?
12. Which dispatcher runs your network call, and which one updates the UI?
13. What happens if you call the API on the main thread?
14. What is a coroutine scope, and which one did you launch from?
15. How does your code tell a timeout apart from a bad response?

## C. The Frankfurter API and this app

16. What is the exact endpoint for converting an amount, and what parameters does it take?
17. Frankfurter needs no API key. What does that mean for how you secure your app?
18. The response nests rates inside a `rates` object keyed by currency code. How did you model that in Kotlin?
19. Why is a `Map<String, Double>` a reasonable model for the rates field here?
20. Does the API do the multiplication for you, or do you multiply the rate by the amount yourself?
21. What does the `date` field in the response tell you, and why is it not always today?
22. Frankfurter only covers about 30 currencies. How does your app behave for an unsupported one?
23. What happens if the user enters an amount of zero, or leaves the field empty?
24. How would you fetch rates for a past date, and which parameter controls that?

## D. Edge cases, design and extensions

25. What does your app show while the request is in flight?
26. A user has no connection and taps convert. Describe exactly what they see.
27. Exchange rates update once a day on this API. Should you call it on every keystroke? Why not?
28. How would you cache the last rates so the app works offline?
29. How would you add a swap button that flips the two currencies? What state changes?
30. How would you display a chart of the last 30 days for a currency pair?
