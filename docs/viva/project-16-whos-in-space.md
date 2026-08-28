# Viva: Project 16, Who's in Space?

**API:** Open Notify (http://open-notify.org) · **Key:** No key needed
**Brief:** List astronauts currently in space and show the live ISS position.

> 30 questions, roughly easy to hard. Sections A and B are common ground for every
> project; C and D are specific to this one. Ask 8 to 12 in a typical 10 minute viva.

## A. Kotlin and Android basics

1. What is the difference between `val` and `var`, and which did you use for your Retrofit instance?
2. What is a data class, and what does Kotlin generate for you?
3. How did you model an astronaut, and how did you model the ISS position?
4. What does `?` mean on a property, and are any fields here genuinely optional?
5. Which Android component holds your screen state, and what happens on rotation?
6. How does a RecyclerView adapter know what to draw for each astronaut?
7. Where do you declare the INTERNET permission, and what happens if you forget it?

## B. Retrofit, coroutines and networking

8. What problem does Retrofit solve for you?
9. Explain the role of the converter factory in your Retrofit builder.
10. These endpoints take no parameters at all. What does your interface method look like?
11. Why is your API call function marked `suspend`?
12. Which dispatcher runs the network call, and which updates the UI?
13. You call two endpoints. Sequentially or in parallel, and how did you do it?
14. What is a coroutine scope, and which one did you launch from?
15. How does your app behave if the astronaut call succeeds but the ISS call fails?

## C. The Open Notify API and this app

16. What are the two endpoints, and what does each return?
17. Open Notify is served over plain HTTP, not HTTPS. Why does that break on modern Android, and what did you have to configure?
18. What is cleartext traffic policy, and why does Android block it by default since API 28?
19. Is allowing cleartext for this domain a good idea? What are the risks?
20. The ISS position returns `latitude` and `longitude` as strings, not numbers. Why is that annoying and what did you do?
21. `timestamp` comes back as a Unix epoch integer. How did you convert it to a readable time?
22. The astronaut response has a `number` field and a `people` array. Did you use `number` or `people.size`, and why?
23. Each astronaut has a `craft` field. What are the possible values and how did you group by it?
24. The ISS moves roughly 7.6 km per second. How often did you refresh the position, and why that interval?

## D. Edge cases, design and extensions

25. What does your app show while the requests are in flight?
26. A user has no connection and opens the app. Describe exactly what they see.
27. Open Notify is a hobby API with occasional downtime. How does your app fail gracefully?
28. How would you plot the ISS position on a map instead of showing raw coordinates?
29. How would you stop the refresh timer when the app goes to the background, and why does that matter?
30. How would you show when the ISS next passes over the user's location?
