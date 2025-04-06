document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('surveyForm');
    let resultsWindow = null;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        
        const now = new Date();
        document.getElementById('submissionTime').value = now.toISOString();
        
        
        if (form.checkValidity()) {
            
            const formData = new FormData(form);
            const formDataObj = Object.fromEntries(formData.entries());
            
       
            let submissions = JSON.parse(localStorage.getItem('touristSubmissions')) || [];
            
            
            submissions.push(formDataObj);
            localStorage.setItem('touristSubmissions', JSON.stringify(submissions));
            
           
            if (!resultsWindow || resultsWindow.closed) {
                resultsWindow = window.open(
                    'result.html', 
                    'surveyResults', 
                    'width=800,height=700,resizable=yes'
                );
            } else {
                resultsWindow.location.reload();
                resultsWindow.focus();
            }
        } else {
          
            form.reportValidity();
        }
    });
});