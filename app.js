// The idea of breaking budget and UI related functions into IIFEs is to maintain them as separate modules that handle data independently.
// This way making changes to UI doesn't affect budget functionality and vice-versa. This is also called 'Separation of Concerns'. It means each part of the application should only be interested in doing one thing independently.

// BUDGET CONTROLLER
var budgetController = (function() {
  var Expense = function(id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
    this.percentage = -1;
  };

  // calculate percentage
  Expense.prototype.calcPercentage = function(totalIncome) {
    if(totalIncome > 0) {
      this.percentage = Math.round((this.value / totalIncome) * 100);
    } else {
      this.percentage = -1;
    }
  };

  // return percentage
  Expense.prototype.getPercentage = function() {
    return this.percentage;
  };

  var Income = function(id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
  };

  var calculateTotal = function(type) {
    var sum = 0;

    data.allItems[type].forEach(function(cur) {
      sum += cur.value;
    });

    data.totals[type] = sum;
  };

  // this is a unified data structure to store all user-entered data at one place.
  var data = {
    allItems: {
      exp: [],
      inc: []
    },
    totals: {
      exp: 0,
      inc: 0
    },
    budget: 0,
    // here we initialized percentage to -1 instead of 0 because -1 usually indicates that something is non-existent.
    percentage: -1
  };

  return {
    addItem: function(type, des, val) {
      var newItem, ID;

      // I think this ID is about creating a serial number for each item in our data structure.
      // Create new ID
      if(data.allItems[type].length > 0) {
        ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
      } else {
        ID = 0;
      }

      // Create new item based on 'inc' or 'exp' type.
      if(type == 'exp') {
        newItem = new Expense(ID, des, val);
      } else if(type == 'inc') {
        newItem = new Income(ID, des, val);
      }

      // Push it into our data structure
      data.allItems[type].push(newItem);

      // Return the new element
      return newItem;
    },

    deleteItem: function(type, id) {
      var ids, index;

      // let's say we have ids of 'exp' or 'inc' array in data as [0, 1, 2, 3, 4]. Here it would be easy to delete the particular item based on the id input to this function alone. However, once we start delete items the ids will be non-consecutive ([1, 2, 4, 6, 8]), which messes up things when we try to delete an item by the id input to this function. So, solution is to create a separate array of ids and then find the index of the id input to this function. That index would be used to delete items from data.allItems[type]. Revise Section 6.91 for detailed explanation
      ids = data.allItems[type].map(function(current) {
        return current.id;
      });

      index = ids.indexOf(id);

      if(index !== -1) {
        data.allItems[type].splice(index, 1);
      }
    },

    calculateBudget: function() {
      // calculate total income and expenses
      calculateTotal('exp');
      calculateTotal('inc');

      // calculate the budget: income - expenses
      data.budget = data.totals.inc - data.totals.exp;

      // calculate the percentage of income that we spent
      if(data.totals.inc > 0) {
        data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
      } else {
        data.percentage = -1;
      }
    },

    calculatePercentages: function() {
      data.allItems.exp.forEach(function(cur) {
        cur.calcPercentage(data.totals.inc);
      });
    },

    getPercentages: function() {
      var allPerc = data.allItems.exp.map(function(cur) {
        return cur.getPercentage();
      });

      return allPerc;
    },

    getBudget: function() {
      return {
        budget: data.budget,
        totalInc: data.totals.inc,
        totalExp: data.totals.exp,
        percentage: data.percentage
      }
    },

    testing: function() {
      console.log(data);
    },

    returnData: function() {
      return data;
    }
  };
})();


// UI CONTROLLER
var UIController = (function() {
  var DOMStrings = {
    inputType: '.add__type',
    inputDescription: '.add__description',
    inputValue: '.add__value',
    inputBtn: '.add__btn',
    incomeContainer: '.income__list',
    expensesContainer: '.expenses__list',
    budgetLabel: '.budget__value',
    incomeLabel: '.budget__income--value',
    expenseLabel: '.budget__expenses--value',
    percentageLabel: '.budget__expenses--percentage',
    container: '.container',
    expensesPercLabel: '.item__percentage',
    dateLabel: '.budget__title--month'
  };

  var formatNumber = function(num, type) {
    var numSplit, int, dec;

    // add + or - before a number
    // display numbers with exactly 2 decimal points
    // add comma to separate thousands
    // ex: 2310.4567 --> +2,310.46

    num = Math.abs(num);
    num = num.toFixed(2); // this gives a string

    numSplit = num.split('.');

    int = numSplit[0]; // int and dec are still strings
    if(int.length > 3) {
      int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, 3);
    }

    dec = numSplit[1];

    return (type === 'exp' ? '-' : '+') + ' ' + int + '.' + dec;
  };

  // declaring nodeListForEach. This is to loop over any nodeList
  var nodeListForEach = function(list, callback) {
    for(var i = 0; i < list.length; i++) {
      callback(list[i], i);
    }
  };

  return {
    getinput: function() {
      // controller will call this method and it should get the values of type, description and value. That's why they are returned as an object.
      return {
        type: document.querySelector(DOMStrings.inputType).value, // Will be either 'inc' or 'exp'.
        description: document.querySelector(DOMStrings.inputDescription).value,
        value: parseFloat(document.querySelector(DOMStrings.inputValue).value)
      };
    },

    addListItem: function(obj, type) {
      var html, newHtml, element;

      // Create HTML string with placeholder text
      // In the HTML text below, since we have so many double quotes within, it is better single quotes to enclose all of the text. This way JavaScript won't interpret the next double quote it encounters as end of the string.
      if(type === 'inc') {
        element = DOMStrings.incomeContainer;

        html = '<div class="item clearfix" id="inc-%id%"> <div class="item__description">%description%</div> <div class="right clearfix"> <div class="item__value">%value%</div> <div class="item__delete"> <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button> </div> </div> </div>';
      } else if(type === 'exp') {
        element = DOMStrings.expensesContainer;

        html = '<div class="item clearfix" id="exp-%id%"> <div class="item__description">%description%</div> <div class="right clearfix"> <div class="item__value">%value%</div> <div class="item__percentage">21%</div> <div class="item__delete"> <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button> </div> </div> </div>';
      }

      // Replace placeholder text with some actual data
      newHtml = html.replace('%id%', obj.id);
      newHtml = newHtml.replace('%description%', obj.description);
      newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));

      // Insert the HTML into the DOM
      document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
    },

    deleteListItem: function(selectorID) {
      var el = document.getElementById(selectorID);
      el.parentNode.removeChild(el);

      // el.style.display = 'none'; // my alternative for removing child node
    },

    clearFields: function() {
      var fields, fieldsArr;

      // fields is now a nodelist, which is not exactly an array and so does not inherit methods from Array's prototype.
      fields = document.querySelectorAll(DOMStrings.inputDescription + ', ' + DOMStrings.inputValue);

      // this will trick the slice method into thinking that we gave it an array and it will return an array.
      fieldsArr = Array.prototype.slice.call(fields);

      fieldsArr.forEach(function(current, index, array) {
        current.value = '';
      });

      // shifts focus to description field even if the focus is at value fields by the time of printing the data to the HTML.
      fieldsArr[0].focus();
    },

    displayBudget: function(obj) {
      var type;
      obj.budget > 0 ? type = 'inc' : type = 'exp';

      document.querySelector(DOMStrings.budgetLabel).textContent = formatNumber(obj.budget, type);
      document.querySelector(DOMStrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
      document.querySelector(DOMStrings.expenseLabel).textContent = formatNumber(obj.totalExp, 'exp');

      if(obj.percentage > 0) {
        document.querySelector(DOMStrings.percentageLabel).textContent = obj.percentage;
      } else {
        document.querySelector(DOMStrings.percentageLabel).textContent = '---';
      }
    },

    displayPercentages: function(percentages) {
      var fields = document.querySelectorAll(DOMStrings.expensesPercLabel);

      // calling nodeListForEach
      nodeListForEach(fields, function(current, index) {
        if(percentages[index] > 0) {
          current.textContent = percentages[index] + '%';
        } else {
          current.textContent = '---';
        }
      });
    },

    displayMonth: function() {
      var now, year, month, months;

      now = new Date();
      year = now.getFullYear();
      month = now.getMonth();
      months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

      document.querySelector(DOMStrings.dateLabel).textContent = months[month] + ', ' + year;
    },

    changedType: function() {
      var fields = document.querySelectorAll(
        DOMStrings.inputType + ',' +
        DOMStrings.inputDescription + ',' +
        DOMStrings.inputValue
      );

      nodeListForEach(fields, function(cur) {
        cur.classList.toggle('red-focus');
      });

      document.querySelector(DOMStrings.inputBtn).classList.toggle('red');
    },

    getDOMStrings: function() {
      // this way we're exposing the DOMStrings object to the global scope.
      return DOMStrings;
    }
  }
})();


// GLOBAL APP CONTROLLER
// Nevertheless, we still need a way to connect data between budget and UI controllers. That's why we create the app controller module. It is like the main control panel of the whole application.
var controller = (function(budgetCtrl, UICtrl) {
  var setupEventListeners = function() {
    var DOM = UICtrl.getDOMStrings();

    // event for clicking the input button
    document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);

    // event for pressing 'Enter' on keyboard
    document.addEventListener('keypress', function(event) {
      if(event.keyCode === 13 || event.which === 13) {
        // keyCode for 'Enter' key is 13
        // which property is for older browsers that don't have keyCode property
        
        ctrlAddItem();
      }
    });

    // event for deleting any item listed in either income or expenses section
    document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);

    // event for changing the type of item
    document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);
  };

  var updateBudget = function() {
    // 1. Calculate the budget
    budgetCtrl.calculateBudget();

    // 2. Return the budget
    var budget = budgetCtrl.getBudget();

    // 3. Display the budget on the UI
    UICtrl.displayBudget(budget);
  };

  var updatePercentages = function() {
    // 1. Calculate percentages
    budgetCtrl.calculatePercentages();

    // 2. Read percentages from the budget controller
    var percentages = budgetCtrl.getPercentages();

    // 3. Update the UI with the new percentages
    UICtrl.displayPercentages(percentages);
  }

  // since this function has access to outerscope functions such as budgetController and UIController, it is logical to use budgetController.method() without passing budgetController as an argument to this function. But it isn't a good practise, because changing the name of one module would require same changes at all other places.
  var ctrlAddItem = function() {
    var input, newItem;

    // 1. Get the fieled input data
    input = UICtrl.getinput();
    console.log(input);

    if(input.description !== '' && !(isNaN(input.value)) && input.value > 0) {
      // 2. Add the item to the budget controller
      newItem = budgetCtrl.addItem(input.type, input.description, input.value);
      // budgetCtrl.testing();

      // 3. Add the item to the UI as well
      UICtrl.addListItem(newItem, input.type);

      // 4. Clear the fields
      UICtrl.clearFields();

      // 5. Calculate and update budget
      updateBudget();

      // 6. Calculate and update percentages
      updatePercentages();
    }
  };

  var ctrlDeleteItem = function(event) {
    var itemID, splitID, type, ID;

    // event.target helps us locate where the event was first fired.
    itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;
    if(itemID) {
      // inc-1
      splitID = itemID.split('-');
      type = splitID[0];
      ID = parseInt(splitID[1]);

      // 1. Delete item from the data structure
      budgetCtrl.deleteItem(type, ID);

      // 2. Delete the item from the UI
      UICtrl.deleteListItem(itemID);

      // 3. Update and show the new budget
      updateBudget();

      // 4. Update and show the new percentages (missing in original code)
      updatePercentages();
    }
  };

  return {
    // we want the init function to be called in the global scope, which is why we're it returning as part of an object.
    init: function() {
      console.log('Application has started.');
      UICtrl.displayBudget({
        budget: 0,
        totalInc: 0,
        totalExp: 0,
        percentage: -1
      });

      setupEventListeners();

      UICtrl.displayMonth();
    }
  };
})(budgetController, UIController);

controller.init();