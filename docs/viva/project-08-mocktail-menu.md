# Viva: Project 08, Mocktail Menu

**API:** TheCocktailDB (https://www.thecocktaildb.com/api.php) · **Key:** Free test key
**Brief:** Browse non-alcoholic drinks by category, with images and recipes.

> 30 questions, roughly easy to hard. Sections A and B are common ground for every
> project; C and D are specific to this one. Ask 8 to 12 in a typical 10 minute viva.

## A. Kotlin and Android basics

1. What is the difference between `val` and `var`, and which did you use for your Retrofit instance?
2. What is a data class, and what does Kotlin generate for you?
3. How did you model a drink, and which fields did you leave out?
4. What does `?` mean on a property, and which drink fields are genuinely optional?
5. How do you pass the selected drink to the detail screen?
6. How does a RecyclerView adapter know what to draw for each row?
7. Where do you declare the INTERNET permission, and what happens if you forget it?

## B. Retrofit, coroutines and networking

8. What problem does Retrofit solve for you?
9. Explain the role of the converter factory in your Retrofit builder.
10. Which annotation carries the filter parameter, and what does the final URL look like?
11. Why is your API call function marked `suspend`?
12. Which dispatcher runs the network call, and which updates the UI?
13. What happens if you call the API on the main thread?
14. What is a coroutine scope, and which one did you launch from?
15. How do you tell a network failure apart from a filter that returns nothing?

## C. TheCocktailDB API and this app

16. Which endpoint filters by non alcoholic drinks, and what exactly does the parameter look like?
17. The filter endpoint returns only id, name and thumbnail. How do you get the full recipe?
18. So how many requests does opening one drink cost, and could you reduce that?
19. Ingredients arrive as `strIngredient1` to `strIngredient15`. Why is that awkward in Kotlin?
20. How did you turn those numbered fields into a clean ingredient list, dropping the empty ones?
21. Each ingredient has a matching measure field. How do you pair them correctly?
22. The `drinks` field is null rather than an empty list when nothing matches. How does your code survive that?
23. How do you load drink images, and what shows while they download?
24. This project is deliberately non alcoholic only. What in your request enforces that, and could a user get around it?

## D. Edge cases, design and extensions

25. What does your app show while the list is loading?
26. A user has no connection and opens the app. Describe exactly what they see.
27. What happens if a drink has 15 ingredients and your layout assumed five?
28. How would you add search by name alongside browse by category?
29. How would you add a favourites list that survives app restarts?
30. How would you group the list alphabetically with sticky headers?
