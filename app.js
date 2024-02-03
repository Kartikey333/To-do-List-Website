const express = require("express");
const bodyParser = require("body-parser")
const date = require(__dirname + "/date.js")
const mongoose = require("mongoose")
const lodash = require("lodash")


const app = express();


app.use(bodyParser.urlencoded({extended:true}));

app.set('view engine', 'ejs');
app.use(express.static("public"));

mongoose.connect("mongodb+srv://kartikey:Mongodbatlas@cluster0.6ntymdl.mongodb.net/todolistDB",{family:4})

const itemsSchema = new mongoose.Schema({
    name : String
});

let day = date.getDate();
const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
    name : "Welcome to our to do list"
});

const item2 = new Item({
    name : "Hit the + button to add a new item."
})

const item3 = new Item({
    name : "<---Hit this to delete an item."
})

const defaultItems = [item1,item2,item3];

const listSchema ={
    name: String,
    items: [itemsSchema]
}

const List = mongoose.model("List",listSchema)

app.get("/",function(req,res){
    
    


    Item.find({}).then(function(foundItems){

        if(foundItems.length === 0){
            Item.insertMany(defaultItems).then(function(){
                console.log("Successfully saved default items!");
            }).catch(function(err){
                console.log(err);
            });
        res.redirect("/");
        }else{
            res.render("list",{
                listTitle : day,
                newListItems : foundItems
            });

        }
        
    }).catch(function(err){
        console.log(err);
    });
          
});

app.get("/:customListName",function(req,res){

    const customListName = lodash.capitalize(req.params.customListName);

    List.findOne({name:customListName}).then(function(foundList){
        if(!foundList){
            //create new
            const list = new List({
                name: customListName,
                items: defaultItems
            });
            list.save();
            res.redirect("/"+customListName)
        }else{
            //show existing
            res.render("list",{
                listTitle : foundList.name,
                newListItems : foundList.items
            });
        }
    }).catch(function(err){
        console.log(err)
    });

    
})

app.post("/",function(req,res){

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name : itemName
    });

    if(listName === day){
        item.save();
        res.redirect("/");
    }else{
        List.findOne({name:listName}).then(function(foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/"+listName)
        }).catch(function(err){
            console.log(err);
        })
    }
    
});

app.post("/delete",function(req,res){
    
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === day){
        Item.findByIdAndRemove(checkedItemId).then(function(){
            console.log("Item deleted")
        }).catch(function(err){
            console.log(err)
        })
        res.redirect("/")
    }else(
        List.findOneAndUpdate({name: listName},{$pull:{items:{_id:checkedItemId}}}).then(function(foundList){
            res.redirect("/" + listName)
        }).catch(function(err){
            console.log(err)
        })
    )

    
})


app.get("/about",function(req,res){
    res.render("about");
})

app.listen(3000,function(){
    console.log("The server is running on port 3000");
})