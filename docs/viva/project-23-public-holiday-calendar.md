# Viva: Project 23, Public Holiday Calendar

**API:** Nager.Date (https://date.nager.at/Api) · **Key:** No key needed
**Brief:** Pick a country and year, list all public holidays.

> 30 questions, roughly easy to hard. Sections A and B are common ground for every
> project; C and D are specific to this one. Ask 8 to 12 in a typical 10 minute viva.

## A. Kotlin and Android basics

1. What is the difference between `val` and `var`, and which did you use for your Retrofit instance?
2. What is a data class, and what does Kotlin generate for you?
3. How did you model a holiday, and which fields did you keep?
4. What does `?` mean on a property, and which holiday fields are genuinely optional?
5. Which Android component holds the selected country and year, and what happens on rotation?
6. How did you build the country picker, hardcoded or from the API?
7. Where do you declare the INTERNET permission, and what happens if you forget it?

## B. Retrofit, coroutines and networking

8. What problem does Retrofit solve for you?
9. Explain the role of the converter factory in your Retrofit builder.
10. Both the year and the country code sit in the path. Which annotation did you use?
11. Why is your API call function marked `suspend`?
12. Which dispatcher runs the network call, and which updates the UI?
13. What happens if you call the API on the main thread?
14. What is a coroutine scope, and which one did you launch from?
15. How do you tell a network failure apart from an unsupported country code?

## C. The Nager.Date API and this app

16. What is the public holidays endpoint, and what does the URL look like for India in 2026?
17. What is an ISO 3166 alpha 2 country code, and where did you get the list of valid ones?
18. Which endpoint returns the list of supported countries, and did you use it?
19. `date` comes as a plain string like `2026-01-26`. How did you parse and format it for display?
20. What is the difference between `name` and `localName`, and which did you show?
21. `counties` is populated for holidays that apply only to certain regions. How did you present that?
22. `global` is a boolean on each holiday. What does it mean, and did you use it?
23. What does the API return for a country it does not support, and how does your app react?
24. How far into the future does this API provide data, and what happens if a user picks 2050?

## D. Edge cases, design and extensions

25. What does your app show while holidays are loading?
26. A user has no connection and picks a country. Describe exactly what they see.
27. How did you sort the holidays, and does the API sort them for you?
28. How would you highlight the next upcoming holiday from today?
29. How would you cache a country and year combination so repeat lookups are instant?
30. How would you add a "days until" countdown next to each holiday?
