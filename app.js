//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require ("mongoose");
const _ = require("lodash");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


mongoose.connect("mongodb+srv://admin-ve3z:P%40ssword12@atlascluster.xqf2vog.mongodb.net/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log("MongoDB connected successfully.");
})
.catch((err) => {
  console.error("Error connecting to MongoDB:", err);
});



//Created Schema
const itemsSchema = new mongoose.Schema({
  name: String
});

//creat model
const Item = mongoose.model("Item" , itemsSchema);

//creatings items
const item1 = new Item({
  name: "Welcome to your List"
}) ;
const item2 = new Item({
  name: "Hit the + button to add new items"
}) ;
const item3 = new Item({
  name: "<<<<<<------ click the checkbox to delete the items"
}) ;

const defaultItems = [item1, item2,item3];

const ListSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("Lists", ListSchema);

const workItems = [];

app.get("/", function(req, res) {

Item.find({})
  .then(foundItems => {
    if (foundItems.length === 0){
        //Insert default items using async/await
        async function insertDefaultItems()
         {
          try 
            {
              await Item.insertMany(defaultItems);
              console.log("Successfully saved default items to db!");
            } 
              catch (error) 
           {
              console.error("Error saving default items:", error);
            }
         }

insertDefaultItems();

    }
    else
        {
            console.log(foundItems);
            res.render("list", { listTitle: "Today", listItems: foundItems });
        }
  })
  .catch(err => {
    console.error("Error finding items:", err);
  });


});

app.get("/:customListName", async function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  try {
    const foundList = await List.findOne({ name: customListName });

    if (!foundList) {
      console.log("Doesn't Exist");

      // Create a new list if it doesn't exist
      const list = new List({
        name: customListName,
        items: defaultItems
      });

      await list.save();
      res.redirect("/" + customListName)
      console.log("New list created successfully.");
    } else {
      res.render("list", { listTitle: foundList.name, listItems: foundList.items });
    }
  } catch (err) {
    console.error("Error finding or creating custom list:", err);
  }

  
});



app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  }) ;

  if(listName === "Today"){
    item.save();
    res.redirect("/")
  }
  else {
    List.findOne({ name: listName })
      .then((foundList) => {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.error(err);
      });
  }

  


});

app.post("/delete", function(req, res){
  const checkedItem = req.body.checkBox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItem)
      .then(() => {
        console.log("Successfully deleted checked item.");
        res.redirect("/"); 
      })
      .catch((err) => {
        console.error("Error deleting checked item:", err);
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItem } } }
    )
      .then(() => {
        console.log("Successfully deleted checked item.");
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.error("Error deleting checked item:", err);
      });
  }
});



app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
