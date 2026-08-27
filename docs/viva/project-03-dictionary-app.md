# Viva: Project 03, Dictionary App

**API:** Free Dictionary API (https://dictionaryapi.dev) · **Key:** No key needed
**Brief:** Type a word and get definitions, phonetics and example sentences.

> 30 questions, roughly easy to hard. Sections A and B are common ground for every
> project; C and D are specific to this one. Ask 8 to 12 in a typical 10 minute viva.

## A. Kotlin and Android basics

1. What is the difference between `val` and `var`, and which did you use for your Retrofit instance?
2. What is a data class, and what does Kotlin generate for you?
3. Your response has lists inside lists. How do you declare a list of a custom type in Kotlin?
4. What does `?` mean on a property, and which dictionary fields are genuinely optional?
5. Which Android component holds your screen state, and what happens on rotation?
6. How does a RecyclerView adapter know what to draw for each row?
7. Where do you declare the INTERNET permission, and what happens if you forget it?

## B. Retrofit, coroutines and networking

8. What problem does Retrofit solve for you?
9. Explain the role of the converter factory in your Retrofit builder.
10. The word goes into the URL path here, not the query string. Which annotation did you use and why?
11. Why is your API call function marked `suspend`?
12. Which dispatcher runs the network call, and which updates the UI?
13. What happens if you call the API on the main thread?
14. What is a coroutine scope, and which one did you launch from?
15. How do you tell a network failure apart from a word that simply does not exist?

## C. The Dictionary API and this app

16. What is the exact endpoint you call, and what does the URL look like for the word "android"?
17. The top level of the response is a JSON array, not an object. How did you model that in Retrofit?
18. Walk me through the nesting: entry, then meanings, then definitions. Which levels did you actually display?
19. What is `partOfSpeech`, and how do you show a word that is both a noun and a verb?
20. Many words have no phonetics or audio. What does your UI do in that case?
21. What HTTP status does the API return for a word it does not know, and how do you handle it?
22. How would you play the pronunciation audio if the response includes an audio URL?
23. Why does this API need no key, and what stops someone abusing it?
24. If a user types a word with a space or a number, what happens?

## D. Edge cases, design and extensions

25. What does your app show while the request is in flight?
26. A user has no connection and searches. Describe exactly what they see.
27. Should you search on every keystroke? What is debouncing and would it help here?
28. How would you store a search history or a favourites list locally?
29. How would you add a "word of the day" feature given this API has no such endpoint?
30. How would you handle synonyms and antonyms, which appear at two different levels of the response?
