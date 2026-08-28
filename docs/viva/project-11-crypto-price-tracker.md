# Viva: Project 11, Crypto Price Tracker

**API:** CoinGecko (https://www.coingecko.com/en/api) · **Key:** No key needed
**Brief:** Live prices of top coins with search and 24-hour change.

> 30 questions, roughly easy to hard. Sections A and B are common ground for every
> project; C and D are specific to this one. Ask 8 to 12 in a typical 10 minute viva.

## A. Kotlin and Android basics

1. What is the difference between `val` and `var`, and which did you use for your Retrofit instance?
2. What is a data class, and what does Kotlin generate for you?
3. Why should a price not be stored as `Float`, and what did you use?
4. What does `?` mean on a property, and which coin fields are genuinely optional?
5. Which Android component holds your screen state, and what happens on rotation?
6. How does a RecyclerView adapter know what to draw for each row?
7. Where do you declare the INTERNET permission, and what happens if you forget it?

## B. Retrofit, coroutines and networking

8. What problem does Retrofit solve for you?
9. Explain the role of the converter factory in your Retrofit builder.
10. Which annotations carry `vs_currency`, `order` and `per_page`?
11. Why is your API call function marked `suspend`?
12. Which dispatcher runs the network call, and which updates the UI?
13. What happens if you call the API on the main thread?
14. What is a coroutine scope, and which one did you launch from?
15. How does your code behave when a refresh fails but you already have data on screen?

## C. The CoinGecko API and this app

16. What is the `/coins/markets` endpoint, and which parameters did you send?
17. Why does `vs_currency` matter, and what happens if you omit it?
18. The field is named `price_change_percentage_24h`. How did you map that snake_case name to Kotlin?
19. How do you colour the 24 hour change green or red, and what do you do at exactly zero?
20. Prices come with many decimal places. How did you format them for display?
21. Coin logos come as URLs. Which library loads them and what does it cache?
22. CoinGecko rate limits free callers to roughly 10 to 30 calls per minute. How does that shape your refresh strategy?
23. What happens to your app if CoinGecko returns HTTP 429, and how should it behave?
24. Is your search done locally on the loaded list, or by calling the search endpoint? Defend the choice.

## D. Edge cases, design and extensions

25. What does your app show while prices are loading?
26. A user has no connection and opens the app. Describe exactly what they see.
27. Prices move constantly. How often do you refresh, and why did you pick that interval?
28. What happens to the scroll position when a refresh replaces the whole list?
29. How would you add a sparkline chart of the last seven days?
30. How would you add a watchlist that survives app restarts?
