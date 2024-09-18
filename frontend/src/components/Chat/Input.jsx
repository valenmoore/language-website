import React, { useState, useEffect } from 'react';

const Input = ({ handlePrompt, language, inputStyle }) => {
    const [inputValue, setInputValue] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioChunks, setAudioChunks] = useState([]);

    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const [recognition] = useState(new SpeechRecognition());

    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.lang = language.bcp;

    let currentText = "";

    useEffect(() => {
        // Initialize MediaRecorder and SpeechRecognition
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            const mR = new MediaRecorder(stream);

            mR.addEventListener('dataavailable', event => {
                setAudioChunks((prev) => [...prev, event.data]);
            });

            setMediaRecorder(mR);
        });

        recognition.addEventListener('result', (e) => {
            currentText = Array.from(e.results)
                .map(result => result[0].transcript)
                .join('');
            setInputValue(currentText);
        });

        recognition.addEventListener("end", () => console.log("Speech recognition ended"));

        return () => {
            recognition.removeEventListener('result', () => {});
            recognition.removeEventListener('end', () => {});
        };
    }, [recognition]);

    useEffect(() => {
        const input = document.querySelector("textarea");
        if (input) {
            input.style.height = 'inherit';
            input.style.height = `${input.scrollHeight}px`;
        }
    }, [inputValue]);

    const handleChange = (e) => {
        e.preventDefault();
        setInputValue(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        recognition.stop();
        if (mediaRecorder) {
            mediaRecorder.stop();
        }
        setIsRecording(false);
        setInputValue(''); // Clear input after submission
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        if (currentText !== "") {
            handlePrompt(currentText, audio);
        } else handlePrompt(inputValue, audio)
        setAudioChunks([]); // Clear the chunks after processing
    };

    const startRecording = () => {
        if (isRecording) return;
        setAudioChunks([]); // Clear previous chunks before starting new recording
        recognition.start();
        if (mediaRecorder) {
            mediaRecorder.start(500);
        }
        setIsRecording(true);
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} style={inputStyle}>
                <button
                    type="button"
                    className={isRecording ? "recording" : ""}
                    onClick={startRecording}
                >
                    Record
                </button>
                <input
                    onKeyDown={handleKey}
                    placeholder='Enter your message...'
                    value={inputValue}
                    onChange={handleChange}
                />
                <button type="submit">Send</button>
            </form>
        </>
    );
};

export default Input;