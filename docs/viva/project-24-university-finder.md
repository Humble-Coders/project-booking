# Viva: Project 24, University Finder

**API:** Hipolabs Universities (http://universities.hipolabs.com) · **Key:** No key needed
**Brief:** Search universities by country and open their websites.

> 30 questions, roughly easy to hard. Sections A and B are common ground for every
> project; C and D are specific to this one. Ask 8 to 12 in a typical 10 minute viva.

## A. Kotlin and Android basics

1. What is the difference between `val` and `var`, and which did you use for your Retrofit instance?
2. What is a data class, and what does Kotlin generate for you?
3. How did you model a university, and which fields did you keep?
4. What does `?` mean on a property, and which university fields are genuinely optional?
5. Which Android component holds the search results, and what happens on rotation?
6. How does an implicit Intent open a website, and what happens if no browser is installed?
7. Where do you declare the INTERNET permission, and what happens if you forget it?

## B. Retrofit, coroutines and networking

8. What problem does Retrofit solve for you?
9. Explain the role of the converter factory in your Retrofit builder.
10. Which annotation carries the `country` parameter, and what does the final URL look like?
11. Why is your API call function marked `suspend`?
12. Which dispatcher runs the network call, and which updates the UI?
13. What happens if you call the API on the main thread?
14. What is a coroutine scope, and which one did you launch from?
15. How do you tell a network failure apart from a country with no results?

## C. The Hipolabs API and this app

16. What is the search endpoint, and what parameters does it accept besides `country`?
17. This API is served over plain HTTP. What did you have to configure in Android to allow that, and what are the risks?
18. What is cleartext traffic policy, and why does Android block it by default?
19. Field names contain hyphens, such as `state-province` and `alpha_two_code`. Why can Kotlin not use those directly, and how did you map them?
20. `web_pages` and `domains` are both arrays. Why arrays, and which element do you use?
21. Searching for a large country returns hundreds of results in one response. What does that do to load time and memory?
22. Is the response paginated? If not, how did you keep the list smooth?
23. Country matching is exact and case sensitive in places. How does your app handle "india" versus "India"?
24. What happens if the user searches for a country that does not exist?

## D. Edge cases, design and extensions

25. What does your app show while the request is in flight?
26. A user has no connection and searches. Describe exactly what they see.
27. Should you search on every keystroke? What is debouncing and would it help?
28. How would you add local filtering by name within the fetched results?
29. How would you cache results per country so repeat searches are instant?
30. How would you group results by state or province, and which field drives that?
