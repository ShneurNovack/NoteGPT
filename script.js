// Delete the chat log
function deleteChatLog() {
    localStorage.removeItem('chatLog');
    document.getElementById('chat-log').innerHTML = '';
}


// Load notes from local storage
window.onload = function() {
    let notes = JSON.parse(localStorage.getItem('notes')) || [];
    let chatLog = JSON.parse(localStorage.getItem('chatLog')) || [];
    displayNotes(notes);
    displayChatLog(chatLog);
};

// Save a note to local storage
function saveNote() {
    let title = document.getElementById('note-title').value;
    let body = document.getElementById('note-body').value;
    let notes = JSON.parse(localStorage.getItem('notes')) || [];
    notes.push({ title: title, body: body });
    localStorage.setItem('notes', JSON.stringify(notes));
    displayNotes(notes);
}

// Display notes
function displayNotes(notes) {
    let notesDiv = document.getElementById('notes');
    notesDiv.innerHTML = '';
    for (let i = 0; i < notes.length; i++) {
        let noteDiv = document.createElement('div');
        let titleDiv = document.createElement('div');
        titleDiv.textContent = notes[i].title;
        let bodyDiv = document.createElement('div');
        bodyDiv.textContent = notes[i].body;
        let editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.onclick = function() { editNote(i, titleDiv, bodyDiv, editButton); };
        noteDiv.appendChild(titleDiv);
        noteDiv.appendChild(bodyDiv);
        noteDiv.appendChild(editButton);
        notesDiv.appendChild(noteDiv);
    }
}

// Edit a note
function editNote(index, titleDiv, bodyDiv, editButton) {
    let titleInput = document.createElement('input');
    titleInput.value = titleDiv.textContent;
    let bodyTextarea = document.createElement('textarea');
    bodyTextarea.value = bodyDiv.textContent;
    let saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    let deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.onclick = function() { deleteNote(index); };
    titleDiv.parentNode.appendChild(deleteButton);
    saveButton.onclick = function() {
        let notes = JSON.parse(localStorage.getItem('notes')) || [];
        notes[index] = { title: titleInput.value, body: bodyTextarea.value };
        localStorage.setItem('notes', JSON.stringify(notes));
        displayNotes(notes);
        deleteButton.parentNode.removeChild(deleteButton);
    };
    titleDiv.parentNode.replaceChild(titleInput, titleDiv);
    bodyDiv.parentNode.replaceChild(bodyTextarea, bodyDiv);
    editButton.parentNode.replaceChild(saveButton, editButton);
}


// Delete a note
function deleteNote(index) {
    let notes = JSON.parse(localStorage.getItem('notes')) || [];
    notes.splice(index, 1);
    localStorage.setItem('notes', JSON.stringify(notes));
    displayNotes(notes);
}

// Ask the AI a question
function askAI() {
    let input = document.getElementById('chat-input');
    let inputValue = input.value;
  
    let chatLog = JSON.parse(localStorage.getItem('chatLog')) || [];
    chatLog.push({ role: 'user', content: inputValue });
    localStorage.setItem('chatLog', JSON.stringify(chatLog));
    displayChatLog(chatLog);

    // Get notes and format them for the system message
    let notes = JSON.parse(localStorage.getItem('notes')) || [];
    let notesText = notes.map(note => `- Note \n Title: ${note.title}: \n Body: ${note.body}`).join('\n');

    // Prepare the messages for the API call
    let messages = [
        { role: 'system', content: `The users existing notes are as follows:
${notesText}` },
        ...chatLog
    ];

    // Show the AI thinking indicator
    document.getElementById('ai-thinking').style.display = 'block';

    // Call the OpenAI API
    fetch('https://shneurcors.herokuapp.com/https://notegpt.shneur.workers.dev/', {
        method: 'POST',
        body: JSON.stringify({
            model: 'gpt-4',
            messages: messages,
            temperature: 0.5
        })
    })
    .then(response => response.json())
    .then(data => {
               let aiResponse = data.choices[0].message.content;

 // Check if the AI's response includes any note directives
        let noteMatches = [...aiResponse.matchAll(/#\[(note)\]\{(.*?)\}\{(.*?)\}/g)];
        for (let noteMatch of noteMatches) {
            let noteTitle = noteMatch[2];
            let noteBody = noteMatch[3];
            let notes = JSON.parse(localStorage.getItem('notes')) || [];
            notes.push({ title: noteTitle, body: noteBody });
            localStorage.setItem('notes', JSON.stringify(notes));
            displayNotes(notes);

            // Remove the note directive from the AI's response
            aiResponse = aiResponse.replace(noteMatch[0], '');
        }

        // Check if the AI's response includes any editNote directives
        let editNoteMatches = [...aiResponse.matchAll(/#\[(editNote)\]\{(.*?)\}\{(.*?)\}\{(.*?)\}/g)];
        for (let editNoteMatch of editNoteMatches) {
            let noteTitle = editNoteMatch[2];
            let newTitle = editNoteMatch[3];
            let newBody = editNoteMatch[4];
            let notes = JSON.parse(localStorage.getItem('notes')) || [];
            let noteIndex = notes.findIndex(note => note.title === noteTitle);
            if (noteIndex !== -1) {
                notes[noteIndex] = { title: newTitle, body: newBody };
                localStorage.setItem('notes', JSON.stringify(notes));
                displayNotes(notes);

                // Remove the editNote directive from the AI's response
                aiResponse = aiResponse.replace(editNoteMatch[0], '');
            }
        }
      
              // Check if the AI's response includes any deleteNote directives
        let deleteNoteMatches = [...aiResponse.matchAll(/#\[(deleteNote)\]\{(.*?)\}/g)];
        for (let deleteNoteMatch of deleteNoteMatches) {
            let noteTitle = deleteNoteMatch[2];
            let noteIndex = notes.findIndex(note => note.title === noteTitle);
            if (noteIndex !== -1) {
                notes.splice(noteIndex, 1);
                localStorage.setItem('notes', JSON.stringify(notes));
                displayNotes(notes);

                // Remove the deleteNote directive from the AI's response
                aiResponse = aiResponse.replace(deleteNoteMatch[0], '');
            }
        }
      
        chatLog.push({ role: 'assistant', content: aiResponse });
        localStorage.setItem('chatLog', JSON.stringify(chatLog));
        displayChatLog(chatLog);

        // Hide the AI thinking indicator
        document.getElementById('ai-thinking').style.display = 'none';

    });
      // Clear the input field
      let input2 = document.getElementById('chat-input');

    input2.value = '';
}

// Add an event listener to the input field
document.getElementById('chat-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        askAI();
    }
});


// Display the chat log
function displayChatLog(chatLog) {
    let chatLogDiv = document.getElementById('chat-log');
    chatLogDiv.innerHTML = '';
    for (let message of chatLog) {
        let messageDiv = document.createElement('div');
        if (message.role === 'user') {
            messageDiv.id = 'user-message';
        } else if (message.role === 'assistant') {
            messageDiv.id = 'assistant-message';
        }
        messageDiv.textContent = message.content;
        chatLogDiv.appendChild(messageDiv);
    }
      chatLogDiv.scrollTop = chatLogDiv.scrollHeight;

}

// Export notes
function exportNotes() {
    let notes = localStorage.getItem('notes');
    let blob = new Blob([notes], {type: "application/json"});
    let url = URL.createObjectURL(blob);

    let a = document.createElement('a');
    a.download = 'notes.json';
    a.href = url;
    a.click();
    a.remove();
}

// Import notes
function importNotes() {
    document.getElementById('file-input').click();
}

// Handle file select
function handleFileSelect(event) {
    let file = event.target.files[0];
    let reader = new FileReader();
    reader.onload = function(e) {
        let contents = e.target.result;
        let notes = JSON.parse(contents);
        localStorage.setItem('notes', JSON.stringify(notes));
        displayNotes(notes);
    };
    reader.readAsText(file);
}

// Get the modal
var modal = document.getElementById("how-to-modal");

// Get the button that opens the modal```javascript
var btn = document.getElementById("how-to-button");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal 
btn.onclick = function() {
  modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
  modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}
