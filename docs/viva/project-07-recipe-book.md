# Viva: Project 07, Recipe Book

**API:** TheMealDB (https://www.themealdb.com/api.php) · **Key:** Free test key
**Brief:** Search meals and view ingredients and instructions with images.

> 30 questions, roughly easy to hard. Sections A and B are common ground for every
> project; C and D are specific to this one. Ask 8 to 12 in a typical 10 minute viva.

## A. Kotlin and Android basics

1. What is the difference between `val` and `var`, and which did you use for your Retrofit instance?
2. What is a data class, and what does Kotlin generate for you?
3. How did you model a meal, and which fields did you leave out?
4. What does `?` mean on a property, and which meal fields are genuinely optional?
5. How do you pass the selected meal to the detail screen?
6. How does a RecyclerView adapter know what to draw for each row?
7. Where do you declare the INTERNET permission, and what happens if you forget it?

## B. Retrofit, coroutines and networking

8. What problem does Retrofit solve for you?
9. Explain the role of the converter factory in your Retrofit builder.
10. Which annotation carries the search term, and what does the final URL look like?
11. Why is your API call function marked `suspend`?
12. Which dispatcher runs the network call, and which updates the UI?
13. What happens if you call the API on the main thread?
14. What is a coroutine scope, and which one did you launch from?
15. How do you tell a network failure apart from a search that found nothing?

## C. TheMealDB API and this app

16. What is the exact search endpoint, and what is the test API key you used?
17. The response wraps everything in a `meals` field. What is the value of `meals` when nothing matches, and why is that a trap?
18. Ingredients come as `strIngredient1` through `strIngredient20`, flat and numbered. Why is that awkward in Kotlin?
19. How did you turn those 20 numbered fields into a clean list of ingredients?
20. Most of those 20 slots are empty strings or null. How do you filter them out?
21. Each ingredient has a matching `strMeasure` field. How do you pair them up correctly?
22. How do you load the meal thumbnail, and what happens while it is downloading?
23. `strInstructions` is one long string with line breaks. How did you display it readably?
24. What is the difference between search by name and lookup by id, and where did you use each?

## D. Edge cases, design and extensions

25. What does your app show while the request is in flight?
26. A user has no connection and searches. Describe exactly what they see.
27. Should you search on every keystroke? What is debouncing and would it help?
28. How would you add a favourites list that survives app restarts?
29. How would you add browse by category, and which endpoint gives you the categories?
30. How would you show a random meal on app open, and which endpoint does that?
