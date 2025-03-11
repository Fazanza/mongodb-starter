import '@/styles/globals.css';
import { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import React, { useState, useEffect } from 'react';
import fs from 'fs'

let image_analysis: { [key: number]: string } = {
    1: "AI-Generated: The image exhibits soft focus, unnatural artifacts, and slight distortions in hands and objects. Textures may appear overly smooth, and background elements can be warped or inconsistent.",
    2: "Real Image: The image has sharp details, natural lighting, and consistent textures. Hands, facial features, and background elements appear well-defined without distortions or artificial smoothness."
}

// Image 1-12 is AI : 13-24 is real
export default function MyApp({
  pageProps: { session, ...pageProps }
}: AppProps) {
  const [randomNumbers, setRandomNumbers] = useState<number[]>([]);
  const [prompts, setPrompts] = useState<{ [key: number]: string }>({});
  const [responses, setResponses] = useState<{ [key: string]: string }>({});
  const [reasoning, setReasoning] = useState<{ [key: string]: string }>({});
  const [workerID, setWorkerID] = useState<string>(''); // State to store Worker ID
  const [generatedCode, setGeneratedCode] = useState<string | null>(null); // To store the generated code
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0); // Track current question
  const [feedback, setFeedback] = useState<string | null>(null); // Store AI feedback
  const [previousAnswers, setPreviousAnswers] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // Generate 5 unique random numbers between 1 and 24
    const numbers = new Set<number>();
    while (numbers.size < 5) {
      numbers.add(Math.floor(Math.random() * 24) + 1);
    }
    setRandomNumbers(Array.from(numbers));
  }, []);

  const handleResponseChange = (num: string, value: string) => {
    setResponses((prev) => ({
      ...prev,
      [num]: value,
    }));
  };

  const handleReasoningChange = (num: string, value: string) => {
    setReasoning((prev) => ({
      ...prev,
      [num]: value,
    }));
  };

  const handleWorkerIDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWorkerID(e.target.value); // Update Worker ID as the user types
  };

  const generateRandomCode = () => {
    return Math.floor(100000000000000 + Math.random() * 900000000000000).toString();
  };

  // Get AI feedback for current image
  // Handle form submission
  const handleSubmit = async () => {
    if (!workerID.trim()) {
      alert('Please enter your Worker ID.');
      return;
    }

    // Check if all questions are answered
    const answeredCount = Object.keys(responses).length;
    if (answeredCount < randomNumbers.length) {
      alert(`Please answer all questions. You've answered ${answeredCount} out of ${randomNumbers.length}.`);
      return;
    }

    const data = {
      workerID,  // Include the workerID in the data
      responses,  // All the responses collected in the responses object
      reasoning,  // Include reasoning for each response
    };

    try {
      const response = await fetch('/api/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        const code = generateRandomCode();
        setGeneratedCode(code);
        console.log(result.message);
      } else {
        alert('Error submitting responses.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error submitting responses.');
    }
  };

  // Add this to your existing state variables
  const [needsAIHelp, setNeedsAIHelp] = useState<boolean>(false);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // This function checks if the answer is correct (Images 1-12 are AI, 13-24 are real)
  const checkAnswer = (imageNumber: number, answer: string): boolean => {
    // Images 1-12 are AI, 13-24 are real
    const isAI = imageNumber >= 1 && imageNumber <= 12;
    return (isAI && answer === "Yes") || (!isAI && answer === "No");
  };

  // Modify your goToNextQuestion function
  const goToNextQuestion = async () => {
    // Only proceed if current question is answered
    const currentNum = randomNumbers[currentQuestionIndex];
    const currentResponse = responses[currentNum?.toString()];
    const currentReasoning = reasoning[currentNum?.toString()];

    if (!currentResponse) {
      alert('Please select whether the image is AI-generated or not before proceeding.');
      return;
    }

    // Check if the answer is correct
    const isCorrect = checkAnswer(currentNum, currentResponse);
    console.log(isCorrect)

    // Update previousAnswers state
    setPreviousAnswers(prev => ({
      ...prev,
      [currentNum]: isCorrect
    }));

    // If answer is incorrect, set flag to get AI help for next question
    if (!isCorrect) {
      setNeedsAIHelp(true);
    }

    if (currentQuestionIndex < randomNumbers.length - 1) {
      // Move to next question
      setTimeout(() => {
        setFeedback(null);
        setCurrentQuestionIndex(currentQuestionIndex + 1);

        // If user got the previous question wrong, get AI help for this new question
        if (!isCorrect) {
          getAIFeedbackForNextQuestion(randomNumbers[currentQuestionIndex + 1], currentReasoning);
        }
      }, 1000);
    }
  };

  const getAIFeedbackForNextQuestion = async (imageNumber: number, reasoning: string) => {
    setAiLoading(true);

    const index = Math.floor((imageNumber - 1)/ 12) + 1
    let messageString = "Using the image judgement provided here from AI previously:"
    messageString += image_analysis[index]
    messageString += ", explain why the following reasoning is incorrect for why the image is AI-generated or not: "
    messageString += reasoning
    console.log(messageString)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageString
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFeedback(data.choices?.[0]?.message?.content || "No response");
      } else {
        console.error('Error getting AI feedback');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setAiLoading(false);
    }
  };



  // Calculate progress percentage
  const progressPercentage = ((currentQuestionIndex + 1) / randomNumbers.length) * 100;

  return (
    <SessionProvider session={session}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-purple-600 drop-shadow-md">
          Amazon Turk - Is the Image AI?
        </h1>

        <div className="w-full mb-6">
          <div className="bg-gray-100 p-6 rounded-lg shadow-lg mb-8 mx-auto w-full sm:w-3/4 md:w-2/3 lg:w-1/2">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 text-center">Instructions</h3>
              <p className="text-sm text-gray-600 mt-2">
                <b>1)</b> Answer for each of the next {randomNumbers.length} questions whether it's AI-generated or a genuine photograph. If you get any of the answer's wrong,
                an AI-assistant will assist you in answering the photos after that photo.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <b>2)</b> Explain your reasoning for your answer in the text box provided.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <b>3)</b> Use the 'Next' and 'Previous' buttons to navigate between questions.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <b>4)</b> Once you&apos;ve answered all the questions, click the &quot;Submit&quot; button at the bottom of the page to receive a unique 15-digit code.
              </p>
            </div>
          </div>
        </div>

        <div className="items-center space-x-3 text-center mb-6">
          <label htmlFor="workID" className="text-m font-medium text-gray-700">
            <b>Amazon Worker ID:</b>
          </label>
          <input
            type="text"
            id="workID"
            value={workerID}  // Bind the input field to the workerID state
            onChange={handleWorkerIDChange}  // Handle change to update the state
            placeholder="ex: 989485250"
            className="p-2 border border-gray-300 rounded-md w-64 h-8 text-center focus:ring focus:ring-blue-200"
          />
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-4 mb-6 mx-auto max-w-2xl">
          <div
            className="bg-purple-600 h-4 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
          <div className="text-center mt-2 text-sm text-gray-600">
            Question {currentQuestionIndex + 1} of {randomNumbers.length}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-6 p-6">
          {randomNumbers.length > 0 && currentQuestionIndex < randomNumbers.length && (
            <div
              key={randomNumbers[currentQuestionIndex]}
              className="flex flex-col items-center bg-white shadow-md p-6 rounded-lg border w-full md:w-3/4 lg:w-2/3 mx-auto border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <div className="flex gap-8 mb-4 justify-center">
                <div className="flex flex-col items-center">
                  <img
                    src={`/Images/${randomNumbers[currentQuestionIndex]}.jpeg`}
                    alt={`Image ${randomNumbers[currentQuestionIndex]}`}
                    className="w-72 h-72 object-cover rounded-md border border-gray-300 shadow-sm"
                  />
                </div>
              </div>

              <div className="w-1/2 mx-auto text-center mb-4">
                <label htmlFor={`question-${randomNumbers[currentQuestionIndex]}`} className="text-sm font-semibold">
                  <strong>Is this image generated by AI?</strong>
                </label>
                <select
                  id={`question-${randomNumbers[currentQuestionIndex]}`}
                  name={`question-${randomNumbers[currentQuestionIndex]}`}
                  value={responses[randomNumbers[currentQuestionIndex]?.toString()] || ""}
                  onChange={(e) => handleResponseChange(`${randomNumbers[currentQuestionIndex]}`, e.target.value)}
                  className="block w-full mt-2 p-2 border rounded"
                >
                  <option value="">Select an option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              {/* New reasoning text area */}
              <div className="w-full mx-auto mt-4">
                <label htmlFor={`reasoning-${randomNumbers[currentQuestionIndex]}`} className="text-sm font-semibold block text-center mb-2">
                  <strong>Why do you think this is or isn't AI-generated?</strong>
                </label>
                <textarea
                  id={`reasoning-${randomNumbers[currentQuestionIndex]}`}
                  value={reasoning[randomNumbers[currentQuestionIndex]?.toString()] || ""}
                  onChange={(e) => handleReasoningChange(`${randomNumbers[currentQuestionIndex]}`, e.target.value)}
                  placeholder="Explain your reasoning here... (e.g., unnatural lighting, strange details, etc.)"
                  className="block w-full p-3 border rounded min-h-24 focus:ring focus:ring-blue-200"
                />
              </div>
            </div>
          )}
        </div>

        {/* AI Feedback section */}
        {feedback && (
          <div className="mt-4 mb-6 mx-auto max-w-2xl">
            <div className={`p-4 rounded-lg ${
              previousAnswers[randomNumbers[currentQuestionIndex]]
                ? "bg-green-50 border border-green-200"
                : "bg-yellow-50 border border-yellow-200"
            }`}>
              <h3 className="font-semibold mb-2">
                {previousAnswers[randomNumbers[currentQuestionIndex]]
                  ? "Correct! AI Assistant's Analysis:"
                  : "AI Assistant's Analysis:"}
              </h3>
              <p className="text-gray-700">{feedback}</p>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center mt-4 mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-center mt-6 space-x-4">
          {currentQuestionIndex < randomNumbers.length - 1 ? (
            <button
              onClick={goToNextQuestion}
              disabled={isLoading}
              className={`py-2 px-6 rounded-md ${
                isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className={`py-2 px-6 rounded-md ${
                isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              Submit
            </button>
          )}
        </div>

        {generatedCode && (
          <div className="flex justify-center items-center mt-6 space-x-6 m-6">
            <div className="text-sm font-semibold text-gray-600">
              Your 15-digit code:
            </div>
            <div className="text-lg font-semibold text-gray-700 bg-gray-100 p-2 rounded-md border border-gray-300 shadow-sm">
              {generatedCode}
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(generatedCode)}
              className="bg-blue-500 text-white py-2 px-5 text-sm rounded-md shadow-md"
            >
              Copy Code
            </button>
          </div>
        )}

      </div>
    </SessionProvider>
  );
}