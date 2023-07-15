const questions =[
    {
        question: "Who is the father of Naruto Uzumaki?" ,
        answer:[
            {text:"Kakashi Hatake", correct:false},
            {text:"Boruto Uzumaki", correct:false},
            {text:"Minato Namikaze" ,correct:true},
            {text:"Sasuke Uchiha" ,correct:false},
        ]
    },
    {
        question: "Who amongst the following is not a member of Big 3" ,
        answer:[
            {text:"One piece", correct:false},
            {text:"Dragon Ball", correct:true},
            {text:"Naruto" ,correct:false},
            {text:"Bleach" ,correct:false},
        ]
    },
    {
        question: "How many cursed fingers does sukuna have in total?" ,
        answer:[
            {text:"5 Fingers", correct:false},
            {text:"19 Fingers", correct:false},
            {text:"10 Fingers" ,correct:false},
            {text:"20 Fingers" ,correct:true},
        ]
    },
    {
        question: "what was the actual name of character L from DeathNote" ,
        answer:[
            {text:"L Lawliet", correct:true},
            {text:"Light Yagami", correct:false},
            {text:"Ray Penber" ,correct:false},
            {text:"Ryuk" ,correct:false},
        ]
    },
    {
        question: "What was the name of the first ship of Strawhat pirates" ,
        answer:[
            {text:"Going Mary", correct:true},
            {text:"Sunny", correct:false},
            {text:"Black Pearl" ,correct:false},
            {text:"Flying Dutchman" ,correct:false},
        ]
    },
    {
        question: "How many supreme grade Swords are in One Piece" ,
        answer:[
            {text:"5", correct:false},
            {text:"21", correct:false},
            {text:"12" ,correct:true},
            {text:"17" ,correct:false},
        ]
    },
    {
        question: "what is the name of the Lion sin of seven Deadly Sin" ,
        answer:[
            {text:"Meliodas", correct:false},
            {text:"Escanor", correct:true},
            {text:"King" ,correct:false},
            {text:"Ban" ,correct:false},
        ]
    },
    {
        question: "which universe does jiren belong" ,
        answer:[
            {text:"Universe 3", correct:false},
            {text:"Universe 7", correct:false},
            {text:"Universe 11" ,correct:true},
            {text:"Universe 8" ,correct:false},
        ]
    },
    {
        question: "what type of magic does Yami uses" ,
        answer:[
            {text:"Anti magic", correct:false},
            {text:"Dark magic", correct:true},
            {text:"Wind magic" ,correct:false},
            {text:"Time magic" ,correct:false},
        ]
    },
    {
        question: "which Sword zoro does not use right now!" ,
        answer:[
            {text:"Enma.", correct:false},
            {text:"Shusui", correct:true},
            {text:"Sandai Kitetsu" ,correct:false},
            {text:"Wado Ichimonji" ,correct:false},
        ]
    },
];

const quesElement=document.getElementById("question");
const ansButton=document.getElementById("ans");
const nextButton=document.getElementById("nextBtn");
let currQuesIndex=0;
let score =0;
function startQuiz(){
    currQuesIndex=0;
     score =0;
     nextButton.innerHTML="Next";
     showQuestion();
}
function showQuestion(){
    reset();
    let currentQuestion = questions[currQuesIndex];
    let quesNo=currQuesIndex+1;
      quesElement.innerHTML=quesNo+". "+ currentQuestion.question;

      currentQuestion.answer.forEach(answer=>{
        const button =document.createElement("button");
        button.innerHTML=answer.text;
        button.classList.add("btn");
        ans.appendChild(button);
        if(answer.correct){
            button.dataset.correct=answer.correct;
        }
        button.addEventListener("click",selectAnswer);
      });
}

function reset(){
    nextButton.style.display="none";
    while(ansButton.firstChild){
        ansButton.removeChild(ansButton.firstChild);

    }
}
// answer selection and their features

function selectAnswer(e){
        const selectedbtn=e.target;
        const iscorrect =selectedbtn.dataset.correct==="true";
        if(iscorrect){
            selectedbtn.classList.add("correct");
            score++;
        }
        else{
            selectedbtn.classList.add("incorrect");
        }
        Array.from(ansButton.children).forEach(button=>{
            if(button.dataset.correct==="true"){
                button.classList.add("correct");
            }
            button.disabled=true;
        });
        nextButton.style.display="block";
}



// to show the total score 
function showScore(){
    reset();
    quesElement.innerHTML=`you scored ${score} out of ${questions.length}!`;
    nextButton.innerHTML="play again";
    nextButton.style.display="block";
}

// features of next button

function handleNextButton(){
      currQuesIndex++;
      if(currQuesIndex<questions.length){
        showQuestion();
      }
      else{
        showScore();
      }
}





nextButton.addEventListener("click",()=>{
    if(currQuesIndex<questions.length){
        handleNextButton();

    }
    else{
        startQuiz();
    }
})
startQuiz();