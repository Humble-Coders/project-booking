# Viva: Project 22, Cat Facts & Pics

**API:** TheCatAPI + catfact.ninja (https://thecatapi.com) · **Key:** Free API key
**Brief:** Random cat image paired with a random cat fact, two APIs in one app.

> 30 questions, roughly easy to hard. Sections A and B are common ground for every
> project; C and D are specific to this one. Ask 8 to 12 in a typical 10 minute viva.

## A. Kotlin and Android basics

1. What is the difference between `val` and `var`, and which did you use for your Retrofit instances?
2. What is a data class, and what does Kotlin generate for you?
3. You have two unrelated responses. How did you model them, and did you combine them into one UI model?
4. What does `?` mean on a property, and are any fields here genuinely optional?
5. Which Android component holds the current pairing, and what happens on rotation?
6. How do you keep the image and the fact in sync when only one of them refreshes?
7. Where do you declare the INTERNET permission, and what happens if you forget it?

## B. Retrofit, coroutines and networking

8. This project talks to two different base URLs. How do you configure Retrofit for that?
9. Did you build two Retrofit instances or one with full URLs? Defend your choice.
10. Explain the role of the converter factory in your Retrofit builder.
11. Why is your API call function marked `suspend`?
12. You need both responses before you can draw the screen. Did you fetch them sequentially or in parallel?
13. What does `async` plus `await` give you here that two sequential calls do not?
14. What is a coroutine scope, and which one did you launch from?
15. What does your app show if the fact loads but the image fails?

## C. The two APIs and this app

16. What is the TheCatAPI endpoint for a random image, and what is catfact.ninja's endpoint for a fact?
17. TheCatAPI returns a JSON array with one object. How did you model that?
18. catfact.ninja returns a plain object with `fact` and `length`. Why is the shape difference a nuisance?
19. TheCatAPI works without a key at low volume but wants one for higher limits. Where did you store yours?
20. Which header carries TheCatAPI key, and how do you add a header in Retrofit?
21. What are the rate limits on each API, and which is more restrictive?
22. The `length` field on a fact is redundant since you can call `fact.length`. Why might an API include it anyway?
23. Cat images vary wildly in aspect ratio. How did you stop the layout jumping around?
24. Both APIs are third party and independent. What happens to your app if one of them goes down permanently?

## D. Edge cases, design and extensions

25. What does your app show while both requests are in flight?
26. A user has no connection and taps refresh. Describe exactly what they see.
27. What stops overlapping requests when the user taps refresh repeatedly?
28. How would you combine the image and the fact into one shareable picture?
29. How would you save favourite pairings so they survive app restarts?
30. How would you preload the next pairing so the refresh feels instant?
