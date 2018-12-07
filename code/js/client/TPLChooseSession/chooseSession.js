function displayList () { 

    if (document.getElementById("myList").style.display === "inline") {
               
        document.getElementById("arrow").src = "chooseSession/down-arrow.png"; 

        document.getElementById("myList").style.display = "none";   
        
    }
    else {
        
        document.getElementById("arrow").src = "chooseSession/up-arrow.png"; 

        document.getElementById("myList").style.display = "inline";   
        
    }
                                       
}


function OnSelectedIndexChange() {
    
    document.getElementById("arrow").src = "chooseSession/down-arrow.png"; 

    document.getElementById("myList").style.display = "none"; 
    
    document.getElementById('session').value = document.getElementById('sessionsList').value;
    
}


