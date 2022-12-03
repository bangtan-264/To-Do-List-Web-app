const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
require("dotenv").config();
const mongoose = require("mongoose");
const PORT = process.env.port || 3000;

const app = express();

// Run main function and catch error
main().catch((err) => console.log(err));

// async function
async function main() {
  //localhost ain't working because in config it's binding to 127.0.0.1
  // const url = "mongodb://localhost:27017";
  const url = process.env.MONGO_URL;
  const dbPath = "/todolistDB";
  await mongoose.connect(url + dbPath, {
    useNewUrlParser: true,
  });
}

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Wake up",
});
const item2 = new Item({
  name: "Work hard",
});
const item3 = new Item({
  name: "Enjoy success",
});

const defaultItems = [item1, item2, item3];

//Schema for custom list
const listSchema = {
  name: String,
  items: [itemsSchema],
};
const List = mongoose.model("List", listSchema);

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length == 0) {
      //foundItems may be an array of items
      Item.insertMany(defaultItems, (err) => {
        if (err) console.log(err);
        else console.log("Items successfully added");
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

//dynamic route
app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  //Finds if the list with customListName already exists
  List.findOne({ name: customListName }, (err, foundList) => {
    if (err) {
      console.log(err);
    } else {
      if (!foundList) {
        //Create a new list
        console.log("Doesn't exist");

        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save(() => res.redirect("/" + customListName));

        // res.redirect("/" + customListName);
      } else {
        //Display existing list
        console.log("exists");
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });

  //post req from default list
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  }
  //post req from custom list
  else {
    //first find the list document
    List.findOne({ name: listName }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save((err, result) => {
        res.redirect("/" + listName);
      });
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (err) console.log(err);
      else console.log("Successfully removed item");
    });
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.pull({ _id: checkedItemId });
      foundList.save(function () {
        res.redirect("/" + listName);
      });
    });
  }
});

app.post("/work", function (req, res) {
  let item = req.body.newItem;
  workItems.push(item);
  res.redirect("/work");
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(PORT, async () => {
  try {
    console.log(`Server started on port ${PORT}`);
  } catch (err) {
    console.log(err.message);
  }
});
