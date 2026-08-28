# Viva: Project 14, Book Finder

**API:** Open Library (https://openlibrary.org/developers/api) · **Key:** No key needed
**Brief:** Search books and show covers, authors and publish year.

> 30 questions, roughly easy to hard. Sections A and B are common ground for every
> project; C and D are specific to this one. Ask 8 to 12 in a typical 10 minute viva.

## A. Kotlin and Android basics

1. What is the difference between `val` and `var`, and which did you use for your Retrofit instance?
2. What is a data class, and what does Kotlin generate for you?
3. How did you model a book search result, and which fields did you keep?
4. What does `?` mean on a property, and which book fields are genuinely optional?
5. How do you pass the selected book to the detail screen?
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

## C. The Open Library API and this app

16. What is the search endpoint, and what does the `q` parameter accept?
17. Results come under a `docs` array with `numFound`. How did you model that?
18. `author_name` is an array because a book can have several authors. How do you display it?
19. `first_publish_year` is often missing entirely. How does your UI handle a book without a year?
20. Covers are not in the response as URLs. How do you build a cover URL from `cover_i`?
21. What do the S, M and L suffixes mean on the covers endpoint, and which did you pick for a list?
22. What happens when a book has no `cover_i` at all, and what does your app show instead?
23. Open Library results are noisy, with many editions of the same work. How did you deal with duplicates?
24. The search endpoint can be slow for broad queries. What did you do about that in the UI?

## D. Edge cases, design and extensions

25. What does your app show while the request is in flight?
26. A user has no connection and searches. Describe exactly what they see.
27. Should you search on every keystroke? What is debouncing and would it help?
28. How would you page through results beyond the first 100?
29. How would you add a reading list that survives app restarts?
30. How would you search by ISBN instead of title, and which endpoint suits that better?
