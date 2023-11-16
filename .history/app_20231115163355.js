
//gas project /apps/brookers/system 
//This global variable is set to contain the information needed to make a request of the Google App Script server.
const gas_end_point = 'https://script.google.com/macros/s/'+gas_deployment_id+'/exec'

//This global variable defines the first two navigation items in the menu. In this app there are only two main navigation items "Home" and "Locations". These two menu items are visible regardless of login status.  
const nav_menu=[
    //Note that a menu item is added by inserting an object for that menu item. The 'label' is the text that the user sees for that menu option. The function is the javascript function invoked when selecting that option. Here we insert the "home" and "locations" menu items. Both initiate a call to the navigate function which loads the appropriate page. The navigate function is used to help ensure smooth navigation. It allows the user to use the back botton in their browser when navigating between pages on the site (without navigating out ot the site). The navigate can accept parameters that can be passed to the function called by navigate.
    {label:"Home",function:"navigate({fn:'show_home'})"},
    
]

//This global variable sets the menu items for an unautheticated user.  
const unauthenticated_menu=[
    //The unautheticated user is presented with the "Home" and "Locations" (defined in the nav_menu global variable).
    {menu:nav_menu},
    //this empty object inserts a horizontal line in the navigation menu panel
    {},
    //The unauthenticated user is also presented with the "Login" and "Recover password" menu options.
    {label:"Login",function:"login()",home:"Login",panel:"login_panel"},
    {label:"Recover Password",function:"recover_password()",panel:"recover"}, 
]

//This global variable sets the menu items for an autheticated user.  
const authenticated_menu=[
    //The autheticated user is presented with the "Home" and "Locations" (defined in the nav_menu global variable).
    {menu:nav_menu},
    //this empty object inserts a horizontal line in the navigation menu panel
    {},
    //The authenticated user is also presented with additional menu options.
    //The first item loads the user's name (get_user_name) which is the label for a top-level menu which is built for the user functions
    {label:get_user_name,id:"user-menu", menu:[
        //the user functions include the ability to change their password and edit their personal data
        {label:"Change Password",function:"change_password()",panel: "password_panel"},
        {label:"Personal Data",function:"navigate({fn:'personal_data'})"},
    ]},
    //This menu item allows the user to logout
    {label:"Logout",function:"logout()", home:"Logout"},
    //This menu item builds a sub menu that provides the user with the functionality to request time off and see their requests
    //{label:"Time Off",id:"menu1",menu:[
    //    {label:"Request Time Off",function:"navigate({fn:'request_time_off'})"}, 
    //    {label:"My Requests",function:"navigate({fn:'show_time_off'})"}, 
    //]},
    {label:"Reports",id:"menu1",menu:[
        {label:"Toys Overdue",function:"navigate({fn:'overdue_toys'})"}, 
        {label:"Conditions",function:"navigate({fn:'toys_conditions'})"}, 
    ]},
    //This menu item allows the user to add additional users. Note the "roles" property of the object. Only users with the role of "manager", "owner", or "administrator" will see this menu item. User roles are not heirachical. All user types you wish to see a menu item must be listed in the elements of the array.
    {label:"Add Employee",function:"navigate({fn:'create_account'})", roles:["manager","owner","administrator"]}, 
    //This menu item adds the menu item for updating an inventory count. Notice how a parameter is passed to the "ice_cream_inventory" function,
    //the remaining menu items are added
    {label:"Toy Inventory Summary",home:"Inventory",function:"navigate({fn:'toy_list'})", roles:["owner","administrator"]},
    {label:"Check Toys In",home:"Inventory",function:"navigate({fn:'check_toys_in'})", roles:["owner","administrator"]},
    {label:"Check Toys Out",home:"Inventory",function:"navigate({fn:'check_toys_out'})", roles:["owner","administrator"]},
    {label:"Employee List",function:"navigate({fn:'employee_list'})"},
    {label:"Admin Tools",id:"menu2", roles:["manager","owner","administrator"], menu:[
        {label:"Update User",function:"update_user()",panel:"update_user"},
    ]},

]
//unnecessary comment




function show_home(){
    
    //builds the menu for the home screen
    const menu=[]
    //current_menu is a global variable that is built based on the set of menu items defined for users and their roles. 
    for(item of current_menu){
        if(item.home){
            menu.push(`<a onClick="${item.function}">${item.home}</a>`)
        }
    }

    //the main page is rendered with the WholeChildTherapy logo. 

    tag("canvas").innerHTML=` 
    <div class="center-screen">
    
    <p><img height="${window.innerHeight * .6}" src="images/Whole Child Therapy - Logo (1).webp"></p>
    <div style="text-align:center"></div>
    
    
    </div>
    `

    //The navigation menu is hidden (the three parallel lines are show) when the homepage is rendered.
    hide_menu()
}

function get_user_name(){
    //returns the user's first and last name. Used when building the navigation menu to be the label for the menu items related to maintaining the user. The get_user_data function reads the user information from the data cookie that is created when the user logs in.
    data=get_user_data()
    return data.first_name + " " + data.last_name
}

async function toy_list(){
    // create HTML div for data

    tag("canvas").innerHTML= `
    <div class="page">

    <h2> List of Toys </h2>
    <div id="toy_list_panel">
    <i class="fas fa-spinner fa-pulse"></i>
    </div>
    </div>

    `

    const response = await server_request({mode:"get_toys"})

    if (response.status==='success'){
        //we got data back
        console.log(response.records)
        const html = ['<table border="2"><tr>']
        html.push('<th>Toy</th>')
        html.push('<th>Bin</th>')
        html.push('<th>Tags</th>')
        html.push('<th>Quantity</th>')
        html.push('<th>Condition</th>')
        html.push('<th>Category</th>')
        html.push('<th>Check Out</th>')
        //admin only need to code permissions -CH
        html.push('</tr>')

        for(const record of response.records){
            html.push('<tr>')
            html.push(`<td>${record.fields.Toy}</td>`)
            html.push(`<td>${record.fields.Bin}</td>`)
            html.push(`<td>${record.fields.Tags}</td>`)
            html.push(`<td>${record.fields.Quantity}</td>`)
            html.push(`<td>${record.fields.Condition}</td>`)
            html.push(`<td>${record.fields.Category}</td>`)
            //Code buttons to separate pages
            html.push(`<td><button id="CheckOutButton" onclick="check_toys_out({id:${record.id}})">Check Out</button></td>`)
            html.push('</tr>')
        }   

        tag("toy_list_panel").innerHTML = html.join("")

    }else{
        tag("toy_list_panel").innerHTML = "There was an error getting the task data"
    }

}

async function check_toys_in(params){
    console.log('check_toys_in')

    if(!logged_in()){show_home();return}//in case followed a link after logging out. This prevents the user from using this feature when they are not authenticated.

    //First we hide the menu
    hide_menu()

    //This function is set up recursively to build the page for working with inventory. The first time the function is called, the HTML shell is created for displaying either the inventory form for recording the count or the inventory report. Note that this will only be built if there is a "style" property set when the function is called. Once the shell is created, the function is called again to either built the form for recording an inventory count or create the summary report.
    if(!params){
        //building the HTML shell
        tag("canvas").innerHTML=` 
            <div class="page">
                <div id="inventory-title" style="text-align:center"><h2>Check Toys In</h2></div>
                <div id="inventory-message" style="width:100%"></div>
                <div id="inventory_panel"  style="width:100%">
                </div>
            </div>  
        `
    }
}

async function check_toys_out(id){
    tag("canvas").innerHTML= `
    <div class="page">

    <h2> Checked Out Toys </h2>
    <div id="toy_list_panel">
    <i class="fas fa-spinner fa-pulse"></i>
    </div>
    </div>

    `
console.log("New function call id=", id)    

    const response = await server_request({mode:"get_reports_checkedout"})

    if (response.status==='success'){
        //we got data back

        const html = ['<table border="2"><tr>']
        html.push('<th>Toy</th>')
        html.push('<th>Bin</th>')
        html.push('<th>Tags</th>')
        html.push('<th>Quantity</th>')
        html.push('<th>Condition</th>')
        html.push('<th>Category</th>')

        html.push('</tr>')

        for(const record of response.records){
            html.push('<tr>')
            html.push(`<td>${record.fields.Toy}</td>`)
            html.push(`<td>${record.fields.Bin}</td>`)
            html.push(`<td>${record.fields.Tags}</td>`)
            html.push(`<td>${record.fields.Quantity}</td>`)
            html.push(`<td>${record.fields.Condition}</td>`)
            html.push(`<td>${record.fields.Category}</td>`)
            html.push('</tr>')
        }   


        tag("toy_list_panel").innerHTML = html.join("")

    }else{
        tag("toy_list_panel").innerHTML = "There was an error getting the task data"
    }
}

async function overdue_toys(){
    // create HTML div for data

    tag("canvas").innerHTML= `
    <div class="page">

    <h2> Overdue Toys </h2>
    <div id="toy_list_panel">
    <i class="fas fa-spinner fa-pulse"></i>
    </div>
    </div>

    `
    

    const response = await server_request({mode:"get_reports_checkedout"})

    if (response.status==='success'){
        //we got data back

        const html = ['<table border="2"><tr>']
        html.push('<th>Toy</th>')
        html.push('<th>Bin</th>')
        html.push('<th>Tags</th>')
        html.push('<th>Quantity</th>')
        html.push('<th>Condition</th>')
        html.push('<th>Category</th>')

        html.push('</tr>')

        for(const record of response.records){
            html.push('<tr>')
            html.push(`<td>${record.fields.Toy}</td>`)
            html.push(`<td>${record.fields.Bin}</td>`)
            html.push(`<td>${record.fields.Tags}</td>`)
            html.push(`<td>${record.fields.Quantity}</td>`)
            html.push(`<td>${record.fields.Condition}</td>`)
            html.push(`<td>${record.fields.Category}</td>`)
            html.push('</tr>')
        }   


        tag("toy_list_panel").innerHTML = html.join("")

    }else{
        tag("toy_list_panel").innerHTML = "There was an error getting the task data"
    }


    
}

async function toys_conditions(){
    // create HTML div for data

    tag("canvas").innerHTML= `
    <div class="page">

    <h2> Poor Condition Toys </h2>
    <div id="toy_list_panel">
    <i class="fas fa-spinner fa-pulse"></i>
    </div>
    </div>

    `
    

    const response = await server_request({mode:"get_reports_condition"})

    if (response.status==='success'){
        //we got data back

        const html = ['<table border="2"><tr>']
        html.push('<th>Toy</th>')
        html.push('<th>Bin</th>')
        html.push('<th>Tags</th>')
        html.push('<th>Quantity</th>')
        html.push('<th>Condition</th>')
        html.push('<th>Category</th>')
        html.push('</tr>')

        for(const record of response.records){
            html.push('<tr>')
            html.push(`<td>${record.fields.Toy}</td>`)
            html.push(`<td>${record.fields.Bin}</td>`)
            html.push(`<td>${record.fields.Tags}</td>`)
            html.push(`<td>${record.fields.Quantity}</td>`)
            html.push(`<td>${record.fields.Condition}</td>`)
            html.push(`<td>${record.fields.Category}</td>`)

            html.push('</tr>')
        }   


        tag("toy_list_panel").innerHTML = html.join("")

    }else{
        tag("toy_list_panel").innerHTML = "There was an error getting the task data"
    }


    
}

async function request_time_off(){
    //This is an example of embedding a data form that is created in Airtable. This form allows a user to make a "time off" request. This form is not secure. Anyone with the link or the id for the form can use it to enter data into Airtable. However, it is easy to build and share an Airtable form. 
    if(!logged_in()){show_home();return}
    const width = 300
    //This form is configured to accept a parameter of the user that is requesting time off. All this means is that the Airtable form, when rendered, will populate with the appropriate user. The user can still change that information and request time off for any user stored in Airtable.
    const url=`https://airtable.com/embed/${request_time_off_share}?prefill_employee=${get_user_data().id}`
    console.log("url",url, get_user_data())
    tag("canvas").innerHTML=`<div class="center-screen"><iframe class="airtable-embed" src="${url}" frameborder="0" onmousewheel="" width="${width}" height="500" style="background-color: white; border: 1px solid #ccc;"></iframe></div>`
    hide_menu()
}

async function show_time_off(){
    //Another example of rendering data directly from Airtable. This function will display the time off requests for a particular employee
    if(!logged_in()){show_home();return}
    const width = 300
    const user_data = get_user_data()
    //notice the filter added to this URL. This filter will be applied to the table in Airtable and will only display the items defined by the filter.
    const url=`https://airtable.com/embed/${show_time_off_share}?filter_employee=${user_data.first_name}+${user_data.last_name}`
    console.log("url",url, get_user_data())
    tag("canvas").innerHTML=`<div class="center-screen"><iframe class="airtable-embed" src="${url}" frameborder="0" onmousewheel="" width="${width}" height="500" style="background-color: white; border: 1px solid #ccc;"></iframe></div>`
    hide_menu()
}

function add_buttons(row,col){
    //this function is used to create the input buttons for recording the inventory observations. Notice that we only use the options for case 3. We might use the other options in the future.
    const box = tag(row + "|" + col.replace(/\s/g,"_"))    
    const container = box.parentElement
    switch(window.cols[col]){
        case 3:
            box.style.display="none"
            container.appendChild(get_div_button(box,"20%",0,"0"))
            container.appendChild(get_div_button(box,"20%",.25,"&#188;"))
            container.appendChild(get_div_button(box,"20%",.5,"&#189;"))
            container.appendChild(get_div_button(box,"20%",.75,"&#190;"))
            container.appendChild(get_div_button(box,"20%",1,"1"))
            break;
        case 2:
            box.style.width="30px"
            container.prepend(get_div_button(box,"15%",2))
            container.prepend(get_div_button(box,"15%",1))
            container.prepend(get_div_button(box,"15%",0))
            break
        case 1:
            box.style.width="30px"
            container.prepend(get_div_button(box,"15%",4))
            container.prepend(get_div_button(box,"15%",3))
            container.prepend(get_div_button(box,"15%",2))
            container.prepend(get_div_button(box,"15%",1))
            container.prepend(get_div_button(box,"15%",0))
            break
        }
}

function get_div_button(box,width,value,label){
    //This sets the color of the buttons to grey when they are selected to visually show that the value has been entered for that item.
    if(label===undefined)(label=value)
    const div=document.createElement('div')
    div.addEventListener("click",async function(event){
        box.value=value
        if(await update_observation(box)){
            for(const div of getAllSiblings(this)){
                if(div.tagName==="DIV"){
                    div.style.backgroundColor="transparent"
                    div.style.color="lightGray"
                    console.log(div)
                }
            }
            this.style.backgroundColor="lightGray"
            this.style.color="black"
        }
    })
    div.style.height="100%"
    div.style.display="inline-block"
    div.style.width=width
    div.style.textAlign="center"
    div.style.borderRadius="50%"
    div.style.color="lightgrey"
    div.innerHTML=label
    
    return div
}


function move_down(source){
    // aids in navigation. selects the next cell below when a value is updated
    const ids=source.id.split("|")
    ids[1]=ids[1].replace(/_/g," ")
    
    let next_flavor=window.rows[window.rows[ids[0]]+1]
    let next_container=ids[1]
    if(!next_flavor){
        next_flavor=window.rows[1]
        next_container = window.cols[window.cols[next_container]+1]
        if(!next_container){
            next_container=window.cols[1]
        }
    }
    tag(next_flavor + "|" + next_container.replace(/\s/g,"_")).focus()
}

function flavor_total(flavor_id){
    //used to calculate the running total for observations as they are entered into the input form
    let flavor_total=0
    for(const key of Object.keys(window.cols)){
        if(isNaN(key)){
           // console.log(flavor_id + "|" + key.replace(/\s/g,"_"))
            flavor_total += parseFloat(tag(flavor_id + "|" + key.replace(/\s/g,"_")).value) || 0
        }
    }
    return flavor_total
}

async function update_observation(entry){
    //this is the function that is called to update an observation when the value is change in the input form.
    //console.log(entry.parentElement)

    if(entry.parentElement.classList.contains("working")){
        // don't allow a cell currently posing to be edited.
        return
    }

    if(!logged_in()){show_home();return}//If the user logs out, not updates are permitted.
    // add data validation. If a values that is not a number has been entered, the cell is highlighted in gray and an error message is presented to the user. No update will be made.
    if(isNaN(entry.value)){
        entry.parentElement.style.backgroundColor="lightGray"
        message({
            message:"Please enter a number",
            title:"Data Error",
            kind:"error",
            seconds:5    
        })
        entry.focus()
        entry.select()

        return
    }
    //We get here if value data has been entered in an input box.
    const flavor_id = entry.id.split("|")[0] //grab the identifier for the flavor
    //build an object with the flavorID, store, container, and quantity to be updated.
    const params={
        item_id:entry.dataset.item_id,
        quantity:entry.value,
        container:entry.dataset.container,
        store:entry.dataset.store,
    }
    //visually signal by modifying the appearance of the cell that the value is currently being updated.
    entry.parentElement.style.backgroundColor=null
    entry.parentElement.classList.add("working")
    
    if(entry.dataset.obs_id){
        // there is already a record for this item.  update it
        params.mode="update_inventory_count"
        params.obs_id=entry.dataset.obs_id
        console.log("updating", params.obs_id)
        //use the server_request function to update the value (the update_inventory_count function in google app script is called and the appropriate flavor, store, container, and quantity information is passed)
        const response=await server_request(params)    
        console.log("update response", response)
        
        if(response.status==="success"){//if the value is successfully updated, the appearance of the cell is changed to reflect the update.
            console.log("updated", flavor_total)
            tag(flavor_id + "|total").innerHTML = flavor_total(flavor_id)
            entry.parentElement.classList.remove("working")
            entry.parentElement.classList.remove("active")
            entry.parentElement.classList.add("inactive")
            entry.dataset.obs_id=response.records[0].id
            return true
        }else{//if the value is not successfully updated, the appearance of the cell is changed to reflect an error and an error message is presented to the user.
            entry.style.backgroundColor="red"
            message({
                message:"Inventory Not Recorded: " + response.message,
                title:"Data Error",
                kind:"error",
                seconds:5    
            })
            return false
        }

    }else{
        // there is no record for this item, insert it using the "insert_inventory_count" function in google app script
        params.mode="insert_inventory_count"
        console.log("inserting")
        const response=await server_request(params)    
        console.log("insert response", response)
        
        if(response.status==="success"){//If it is inserted correctly, the appearance of the cell is changed to reflect the update.
            tag(flavor_id + "|total").innerHTML = flavor_total(flavor_id)
            entry.parentElement.classList.remove("working")
            entry.parentElement.classList.remove("active")
            entry.parentElement.classList.add("inactive")
            entry.dataset.obs_id=response.records[0].id
            return true
        }else{//If it is not inserted correctly, the appearance of the cell is changed to reflect the error and the error message is presented.
            entry.style.backgroundColor="red"
            message({
                message:"Inventory Not Recorded: " + response.message.message,
                title:"Data Error",
                kind:"error",
                seconds:5    
            })
            }
            return false
    }
}


async function employee_list(){
    //this function displays an employee list. If the user role allows, the option to update the user record in Google App Script is presented
    //Note: user information is stored in Airtable. However, to avoid the need to repeatedly access Airtable to retrieve user information, a record is stored in Google App Script. This record must be updated when changes are made to user information in Airtable, thus the need for user information to be updated.
    if(!logged_in()){show_home();return}//in case followed a link after logging out
    hide_menu()
    //Build the HTML placeholders for the employee data.
    tag("canvas").innerHTML=` 
    <div class="page">
        <h2>Employee List</h2>
        <div id="member-list-message" style="padding-top:1rem;margin-bottom:1rem">
        Employee information is private and should not be shared.
        </div>
        <div id="employee_list_panel">
        <i class="fas fa-spinner fa-pulse"></i>
        </div>
    </div>
    `
    
    //retrieve the employee data using the local server_request function to request the Google App Script function "employee_list" retrieve the employee data.
    const response=await server_request({
        mode:"employee_list",
        filter:""
    })

    //build the standard headers for the employee table
    const labels={
        first_name:"First Name",
        last_name:"Last Name",
        email:"Email",
        phone:"Phone",
    }

    //determine if the user has a role that allows for employee updates.
    const is_admin=intersect(get_user_data().roles, ["administrator","owner","manager"]).length>0

    if(response.status==="success"){
        const html=['<table style="background-color:white"><tr>']
        //add the standard headers to the table
        for(const field of response.fields){
            html.push("<th>")
            html.push(labels[field])
            html.push("</th>")
        }
        //If the role is sufficient to perform employee updates, add the header "Action"
        if(is_admin){html.push("<th>Action</th>")}
        html.push("</tr>")

        //process through the employee records that were returned and add them to the table.
        for(const record of response.records){
            html.push("<tr>")
            console.log(record)
            for(const field of response.fields){
                if(record.fields[field]==="withheld"){
                  html.push('<td style="color:lightgray">')
                }else{
                  html.push("<td>")
                }
                html.push(record.fields[field])
                html.push("</td>")
            }
            //If the user is able to perform employee updates, add a button that allows them update employees
            if(is_admin){
                html.push("<td>")
                    html.push(`<a class="tools" onclick="update_user({email:'${record.fields.email}', button:'Update User', mode:'update_user'},tag('member-list-message'))">Update</a>`)
                html.push("</td>")
            }
            html.push("</tr>")
        }
        html.push("</table>")
    
        tag("employee_list_panel").innerHTML=html.join("")
    
    }else{
        tag("employee_list_panel").innerHTML="Unable to get member list: " + response.message + "."
    }    

}

