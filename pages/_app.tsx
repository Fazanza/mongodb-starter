import '@/styles/globals.css';
import { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import React, { useState, useEffect } from 'react';
import clientPromise from '@/lib/mongodb';
import Papa from 'papaparse'; // CSV parser

export default function MyApp({
  pageProps: { session, ...pageProps }
}: AppProps) {
  const [randomNumbers, setRandomNumbers] = useState<number[]>([]);
  const [prompts, setPrompts] = useState<{ [key: number]: string }>({});
  const [responses, setResponses] = useState<{ [key: string]: string }>({});
  const [workerID, setWorkerID] = useState<string>(''); // State to store Worker ID
  const [generatedCode, setGeneratedCode] = useState<string | null>(null); // To store the generated code

  useEffect(() => {
    // Generate 10 unique random numbers between 1 and 99
    const numbers = new Set<number>();
    while (numbers.size < 6) {
      numbers.add(Math.floor(Math.random() * 99) + 1);
    }
    setRandomNumbers(Array.from(numbers));

    fetch('/prompts.csv')
      .then((response) => response.text())
      .then((csvText) => {
        const result = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
        });

        const promptData = result.data.reduce((acc: { [key: number]: string }, row: any) => {
          const imageNumber = parseInt(row.ID);

          if (numbers.has(imageNumber)) {
            acc[imageNumber] = row.Description;
          }

          return acc;
        }, {});

        setPrompts(promptData);
      });
  }, []);

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleWorkerIDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWorkerID(e.target.value); // Update Worker ID as the user types
  };

  const generateRandomCode = () => {
    return Math.floor(100000000000000 + Math.random() * 900000000000000).toString();
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!workerID.trim()) {
      alert('Please enter your Worker ID.');
      return;
    }

    console.log(responses)
    if (Object.keys(responses).length != randomNumbers.length) {
      alert("Please answer all the questions before submitting");
      return;
    }

    for (const key of Object.keys(responses)) {
      if (responses[key].length != 4) {
        alert(`Please answer all the questions for every image before submitting`);
        return;
      }
    }

    const data = {
      workerID,  // Include the workerID in the data
      responses,  // All the responses collected in the responses object
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

  return (
    <SessionProvider session={session}>
      <h1 className="text-3xl font-bold text-center mb-6 text-purple-600 drop-shadow-md">
        Amazon Turk AI Image Classifier
      </h1>

      <div className="w-full mb-6">
        <div className="bg-gray-100 p-6 rounded-lg shadow-lg mb-8 mx-auto w-full sm:w-3/4 md:w-2/3 lg:w-1/2">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 text-center">Instructions</h3>
            <p className="text-sm text-gray-600 mt-2">
              <b>1)</b> Answer questions for each of the 6 pairs of AI generated images. For each question, select either &quot;Image 1&quot; or &quot;Image 2&quot; based on which one fits the criteria better.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <b>2)</b> If each choice equally represents the criteria, select &quot;Can&apos;t Decide&quot;.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <b>3)</b> Once you&apos;ve answered all the questions, click the &quot;Submit&quot; button at the bottom of the page to receive a unique 15-digit code.
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

      <div className="flex flex-wrap justify-center gap-6 p-6">
        {randomNumbers.map((num) => (
          <div
            key={num}
            className="flex flex-col items-center bg-white shadow-md p-6 rounded-lg border w-full md:w-3/4 lg:w-2/3 mx-auto border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
          >
            <div className="text-sm italic font-bold mb-4 text-center">
              {prompts[num] ? prompts[num] : 'Loading prompt...'}
            </div>

            <div className="flex gap-8 mb-4 justify-center">
              <div className="flex flex-col items-center">
                <img
                  src={`/Images/${num}/1.jpeg`}
                  alt={`Image 1 of ${num}`}
                  className="w-72 h-72 object-cover rounded-md border border-gray-300 shadow-sm"
                />
                <span className="mt-2 text-sm font-semibold">Image 1</span>
              </div>
              <div className="flex flex-col items-center">
                <img
                  src={`/Images/${num}/2.jpeg`}
                  alt={`Image 2 of ${num}`}
                  className="w-72 h-72 object-cover rounded-md border border-gray-300 shadow-sm"
                />
                <span className="mt-2 text-sm font-semibold">Image 2</span>
              </div>
            </div>

            <div className="space-y-4 w-1/2 mx-auto text-center">
              {[
                {
                  question: 'Which image appears more detailed and sharp?',
                  questionId: '1'
                },
                {
                  question: 'Which image has better color accuracy?',
                  questionId: '2'
                },
                {
                  question: 'Which image correctly displays the prompt?',
                  questionId: '3'
                },
                {
                  question: 'Which image has more distortions?',
                  questionId: '4'
                }
              ].map(({ question, questionId }) => (
                <div key={questionId} className="flex ml-10 space-x-4">
                  <div className="flex flex-col items-start space-y-2">
                    <label htmlFor={`question-${questionId}-${num}-1`} className="text-sm font-semibold">
                      <strong>{question}</strong>
                    </label>
                    <div className="flex space-x-4">
                      <div className="flex space-x-2">
                        <input
                          type="radio"
                          name={`question-${questionId}-${num}`}
                          value="Image 1"
                          id={`question-${questionId}-${num}-1`}
                          onChange={() => handleResponseChange(`question-${questionId}-${num}`, 'Image 1')}
                        />
                        <label htmlFor={`question-${questionId}-${num}-1`} className="text-sm">
                          Image 1
                        </label>
                      </div>
                      <div className="flex space-x-2">
                        <input
                          type="radio"
                          name={`question-${questionId}-${num}`}
                          value="Image 2"
                          id={`question-${questionId}-${num}-2`}
                          onChange={() => handleResponseChange(`question-${questionId}-${num}`, 'Image 2')}
                        />
                        <label htmlFor={`question-${questionId}-${num}-2`} className="text-sm">
                          Image 2
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name={`question-${questionId}-${num}`}
                          value="Images equally match criteria"
                          id={`question-${questionId}-${num}-3`}
                          onChange={() => handleResponseChange(`question-${questionId}-${num}`, "Images equally match criteria")}
                        />
                        <label htmlFor={`question-${questionId}-${num}-3`} className="text-sm">
                          Images equally match criteria
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {!generatedCode && (
        <div className="flex justify-center mt-8 space-x-4 m-6">
          <button
            onClick={handleSubmit}
            className="bg-blue-500 text-white py-4 px-8 text-lg rounded-md"
          >
            Submit Responses
          </button>
        </div>
      )}

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
    </SessionProvider>
  );
}