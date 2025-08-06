async function sendEmails() {
    const senderEmail = document.getElementById("email").value;
    const senderPassword = document.getElementById("password").value;
    const subject = document.getElementById("subject").value;
    const message = document.getElementById("message").value;
    const recipientList = document.getElementById("recipients").value;

    const response = await fetch("/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderEmail, senderPassword, subject, message, recipientList }),
    });

    document.getElementById("status").innerText = await response.text();
}
