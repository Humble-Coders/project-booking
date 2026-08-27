# Viva: Project 04, Trivia Quiz

**API:** Open Trivia DB (https://opentdb.com/api_config.php) · **Key:** No key needed
**Brief:** Multiple-choice quiz with score tracking; pick category and difficulty.

> 30 questions, roughly easy to hard. Sections A and B are common ground for every
> project; C and D are specific to this one. Ask 8 to 12 in a typical 10 minute viva.

## A. Kotlin and Android basics

1. What is the difference between `val` and `var`, and which did you use for the score?
2. What is a data class, and what does Kotlin generate for you?
3. How did you model a single question, and why is that a good shape for your UI?
4. What is an enum class, and would difficulty be a good candidate for one?
5. Where does the current question index live, and what happens to it on rotation?
6. How do you move from the question screen to the results screen?
7. Where do you declare the INTERNET permission, and what happens if you forget it?

## B. Retrofit, coroutines and networking

8. What problem does Retrofit solve for you?
9. Explain the role of the converter factory in your Retrofit builder.
10. Which query parameters does your quiz request send, and which annotation carries them?
11. Why is your API call function marked `suspend`?
12. Which dispatcher runs the network call, and which updates the UI?
13. Do you fetch all questions at once or one at a time? Defend your choice.
14. What is a coroutine scope, and which one did you launch from?
15. How does your code handle the request failing halfway through a quiz?

## C. The Open Trivia DB API and this app

16. What is the exact endpoint, and what does `amount=10&category=9&difficulty=easy` mean?
17. The API returns a `response_code`. What do codes 0 and 1 mean, and do you check it?
18. Questions come HTML encoded, so `&quot;` appears in the text. How did you decode them?
19. The API gives one correct answer and a separate list of incorrect ones. How do you build the options list?
20. Why must you shuffle the options, and where in your code does that happen?
21. If you do not shuffle, what does the user quickly notice?
22. How do you check whether the user picked the right answer?
23. What happens if you request 50 questions from a category that only has 20?
24. Open Trivia DB supports session tokens to avoid repeats. What problem do they solve?

## D. Edge cases, design and extensions

25. What does your app show while the questions are loading?
26. A user has no connection and starts a quiz. Describe exactly what they see.
27. What stops a user from tapping two answers for the same question?
28. How would you add a countdown timer per question? What happens when it hits zero?
29. How would you persist the high score between app launches?
30. How would you support true or false questions, whose shape differs from multiple choice?
