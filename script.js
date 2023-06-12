const messages = document.getElementById("messages");
const input = document.getElementById("input");
const submit = document.getElementById("submit");
const chatbox = document.getElementById("chat-container");
const toggle = document.getElementById("toggle");
const typingIndicator = document.getElementById("typing-indicator");

document.addEventListener("DOMContentLoaded", () => {
  submitNoMessage()
});

let firstToggle = true;

let conversation = [
  { role: "user", content: `hi` }
];

async function submitNoMessage() {
    // Show typing indicator
  typingIndicator.style.display = "block";

  const response = await sendToChatAPI(conversation);
    addMessage(response, "bot");
  // Hide typing indicator
  typingIndicator.style.display = "none";
}


async function submitMessage() {
  const userInput = input.value;

  addMessage(userInput, "user");
  conversation.push({ role: "user", content: userInput });
  input.value = "";

  // Show typing indicator
  typingIndicator.style.display = "block";

  const response = await sendToChatAPI(conversation);

  // Hide typing indicator
  typingIndicator.style.display = "none";

  addMessage(response, "bot");
  
      const urlRegex = /#(https?:\/\/[^\s]+)/g;
    const match = urlRegex.exec(response);
    if (match) {
        const url = match[1];
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        anchor.click();
    }
}

input.addEventListener("keydown", async (event) => {
  if (event.key === "Enter") {
    event.preventDefault(); // Prevents the default behavior of the "Enter" key.
    submitMessage();
  }
});

submit.addEventListener("click", async () => {
  submitMessage();
});

function addMessage(text, sender) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");
  messageDiv.classList.add(sender);

  const processBoldText = (textContent) => {
    const boldTextRegex = /\*\*(.*?)\*\*/g;
    let result = '';
    let lastIndex = 0;

    while ((match = boldTextRegex.exec(textContent)) !== null) {
      const boldText = match[1];
      result += textContent.slice(lastIndex, match.index);
      result += `<strong>${boldText}</strong>`;
      lastIndex = match.index + match[0].length;
    }

    result += textContent.slice(lastIndex);
    return result;
  };

  if (sender === "bot") {
    text = processBoldText(text);

    // Check for #[img] followed by a URL and create an img element if found
    const imgRegex = /#\[(img)\]((https?:\/\/[^\s]+))/g;
    const matchImg = imgRegex.exec(text);
    if (matchImg) {
      const imgURL = matchImg[2];
      const imgElement = document.createElement("img");
      imgElement.src = imgURL;
      imgElement.alt = "Image from AI";
      imgElement.style.maxWidth = "100%";
      imgElement.style.maxHeight = "200px";
      imgElement.className = "ai-image";
      messageDiv.appendChild(imgElement);
      text = text.replace(matchImg[0], "");
    }

    // Check for hashtag followed by a URL and redirect if found
    const urlRegex = /#(https?:\/\/[^\s]+)/g;
    const match = urlRegex.exec(text);
      text = text.replace(urlRegex, "");
   
  }

  const p = document.createElement("p");
  p.innerHTML = text;
  messageDiv.appendChild(p);
  messages.appendChild(messageDiv);
  messages.scrollTop = messages.scrollHeight;
}



async function sendToChatAPI(conversation) {
  // Replace 'your_api_key_here' with your OpenAI API key
  const apiKey = "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";

  try {
    const response = await axios.post(
      "https://shneurcors.herokuapp.com/https://notegpt.shneur.workers.dev/",
      {
        model: "gpt-3.5-turbo",
        messages: conversation
      }
    );

    const chatResponse = response.data.choices[0].message.content;
    conversation.push({ role: "assistant", content: chatResponse });
    return chatResponse;
  } catch (error) {
    console.error("Error:", error);
    return "I am sorry, I could not process your request.";
  }
}

