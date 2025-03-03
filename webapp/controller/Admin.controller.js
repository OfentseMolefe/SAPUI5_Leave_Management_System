sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel", "sap/m/MessageBox", "sap/ui/core/Fragment"],
  (Controller, JSONModel, MessageBox, Fragment) =>
    Controller.extend("com.emls.controller.Admin", {
      onInit: function () {
        console.log("Admin controller initialized")

        // Initialize the JSON model without sample data
        var oModel = new JSONModel({
          NewRequests: [],
          PendingRequests: [],
          ApprovedRequests: [],
          RejectedRequests: [],
        })

        this.getView().setModel(oModel)
        console.log("Initial model set:", oModel.getData())
        this._initializeModels()

        // Load admin data from the model
        // var oAdminData = this.getOwnerComponent().getModel("adminData").getData()
        // console.log("Admin data loaded:", oAdminData)

        // Load real data
        this._loadDepartments()
        this._loadEmployees()
        this._loadLeaveTypes()
        this._loadLeaveRequests()

        // Initialize a model for the current leave request being processed
        this.getView().setModel(new JSONModel(), "currentLeaveRequest")
      },

      // Load leave requests from server
      _loadLeaveRequests: function () {
        // Fetch all leave requests
        fetch("http://localhost:3000/leave")
          .then((response) => response.json())
          .then((data) => {
            console.log("Fetched leave requests:", data)

            this._processLeaveRequests(data)
          })
          .catch((error) => {
            console.error("Error fetching leave requests:", error)
            MessageBox.error("Failed to load leave requests. Please try again.")
          })
      },

      _processLeaveRequests: function (leaveRequests) {

        var processedRequests = {
          NewRequests: [],
          PendingRequests: [],
          ApprovedRequests: [],
          RejectedRequests: [],
        }

        // Process each leave request
        Promise.all(
          leaveRequests.map((request) => {
            // Fetch employee details for each request
            console.log("Processing leave request:", request)
            return fetch(`http://localhost:3000/employees/${request.empid}`)
              .then((response) => response.json())
              .then((employee) => {
                // Calculate duration
                var fromDate = new Date(request.FromDate)
                var toDate = new Date(request.ToDate)
                var duration = (toDate - fromDate) / (1000 * 60 * 60 * 24) + 1 // +1 to include both start and end dates

                var processedRequest = {
                  id: request.id,
                  employeeName: `${employee.FirstName} ${employee.LastName}`,
                  initials: `${employee.FirstName[0]}.${employee.LastName[0]}`,
                  leaveType: request.LeaveType,
                  duration: duration,
                  startDate: request.FromDate,
                  endDate: request.ToDate,
                  status: request.Status,
                  description: request.Description,
                }

                // Categorize the request based on its status
                switch (request.Status) {
                  case 0:
                    processedRequests.NewRequests.push(processedRequest)
                    break
                  case 1:
                    processedRequests.ApprovedRequests.push(processedRequest)
                    break
                  case 2:
                    processedRequests.PendingRequests.push(processedRequest)
                    break
                  case 3:
                    processedRequests.RejectedRequests.push(processedRequest)
                    break
                }
              })
          }),
        ).then(() => {
          // Update the model with processed requests
          console.log("Processed leave requests:", processedRequests)
          this.getView().getModel().setData(processedRequests)
        })
      },
      // Dashboard navigation handler
      onDashboard: () => {
        console.log("Dashboard navigation requested")
        MessageBox.information("Dashboard functionality to be implemented.")
      },

      // Toggle department submenu
      onToggleDepartmentSubmenu: function (oEvent) {
        console.log("Toggling department submenu")
        this._toggleSubmenu(oEvent, "department")
      },

      // Toggle employee submenu
      onToggleEmployeeSubmenu: function (oEvent) {
        console.log("Toggling employee submenu")
        this._toggleSubmenu(oEvent, "employee")
      },

      // Helper function to toggle submenus
      _toggleSubmenu: function (oEvent, submenuClass) {
        console.log(`Toggling ${submenuClass} submenu`)
        var bExpanded = oEvent.getSource().getCustomData()[0].getValue() === "expanded"
        var aSubmenuItems = this.getView()
          .getContent()[0]
          .getMasterPages()[0]
          .getContent()[0]
          .getItems()
          .filter((item) => item.hasStyleClass("submenuItem") && item.hasStyleClass(submenuClass))

        aSubmenuItems.forEach((item) => {
          item.setVisible(!bExpanded)
        })

        oEvent
          .getSource()
          .getCustomData()[0]
          .setValue(bExpanded ? "collapsed" : "expanded")
      },



      // Initialize view models
      _initializeModels: function () {
        console.log("Initializing view models")
        this.getView().setModel(
          new JSONModel({
            departmentDialogMode: "Add",
            employeeDialogMode: "Add",
          }),
          "viewModel",
        )
      },

      // Department Management

      // Open add department dialog
      onAddDepartment: function () {
        console.log("Opening add department dialog")
        if (!this._oAddDepartmentDialog) {
          this._oAddDepartmentDialog = sap.ui.xmlfragment("com.emls.view.AddDepartment", this)
          this.getView().addDependent(this._oAddDepartmentDialog)
        }
        this._oAddDepartmentDialog.open()
      },

      // Save new department
      onSaveDepartment: function () {
        console.log("Saving new department")
        var oDeptCode = sap.ui.getCore().byId("deptCode")
        var oDeptName = sap.ui.getCore().byId("deptName")
        var oDeptShortName = sap.ui.getCore().byId("deptShortName")

        if (!oDeptCode.getValue() || !oDeptName.getValue() || !oDeptShortName.getValue()) {
          MessageBox.error("Please fill in all required fields.")
          return
        }

        var oNewDepartment = {
          DepartmentName: oDeptName.getValue(),
          DepartmentShortName: oDeptShortName.getValue(),
          DepartmentCode: oDeptCode.getValue(),
        }

        fetch("http://localhost:3000/departments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(oNewDepartment),
        })
          .then((response) => response.json())
          .then((data) => {
            console.log("Department added successfully:", data)
            MessageBox.success("Department added successfully.")
            this._oAddDepartmentDialog.close()
            this._loadDepartments() // Refresh the department list
          })
          .catch((error) => {
            console.error("Error adding department:", error)
            MessageBox.error("Failed to add department. Please try again.")
          })
      },

      // Cancel add department
      onCancelAddDepartment: function () {
        console.log("Cancelling add department")
        this._oAddDepartmentDialog.close()
      },

      // Open manage departments dialog
      onManageDepartments: function () {
        console.log("Opening manage departments dialog")
        if (!this._oManageDepartmentsDialog) {
          this._oManageDepartmentsDialog = sap.ui.xmlfragment("com.emls.view.ManageDepartments", this)
          this.getView().addDependent(this._oManageDepartmentsDialog)
        }
        this._oManageDepartmentsDialog.open()
      },

      // Edit department
      onEditDepartment: function (oEvent) {
        console.log("Editing department")
        var oContext = oEvent.getSource().getBindingContext()
        var oDepartment = oContext.getObject()
        this._oEditDepartmentDialog.data("departmentId", oDepartment.id);
        if (!this._oEditDepartmentDialog) {
          this._oEditDepartmentDialog = sap.ui.xmlfragment("com.emls.view.EditDepartment", this)
          this.getView().addDependent(this._oEditDepartmentDialog)
        }

        sap.ui.getCore().byId("editDeptCode").setValue(oDepartment.DepartmentCode)
        sap.ui.getCore().byId("editDeptName").setValue(oDepartment.DepartmentName)
        sap.ui.getCore().byId("editDeptShortName").setValue(oDepartment.DepartmentShortName)

        this._oEditDepartmentDialog.open()
      },

      // Delete department
      onDeleteDepartment: function (oEvent) {
        console.log("Deleting department")
        var oContext = oEvent.getSource().getBindingContext()
        var oDepartment = oContext.getObject()
        MessageBox.confirm("Are you sure you want to delete " + oDepartment.DepartmentName + "?", {
          onClose: function (oAction) {
            if (oAction === MessageBox.Action.OK) {
              fetch("http://localhost:3000/departments/" + oDepartment.id, {
                method: "DELETE",
              })
                .then((response) => response.json())
                .then((data) => {
                  console.log("Department deleted successfully:", data)
                  MessageBox.success("Department deleted successfully.")
                  this._loadDepartments() // Refresh the department list
                })
                .catch((error) => {
                  console.error("Error deleting department:", error)
                  MessageBox.error("Failed to delete department. Please try again.")
                })
            }
          }.bind(this),
        })
      },

      // Close manage departments dialog
      onCloseManageDepartments: function () {
        console.log("Closing manage departments dialog")
        this._oManageDepartmentsDialog.close()
      },

     // Update _loadDepartments to return a Promise
     _loadDepartments: function() {
      return new Promise((resolve, reject) => {
        fetch("http://localhost:3000/departments")
          .then(response => response.json())
          .then(data => {
            this.getView().getModel().setProperty("/Departments", data);
            resolve();
          })
          .catch(error => reject(error));
      });
    },

      // Save edited department
      onSaveEditDepartment: function () {
        console.log("Saving edited department")
        var oDeptCode = sap.ui.getCore().byId("editDeptCode")
        var oDeptName = sap.ui.getCore().byId("editDeptName")
        var oDeptShortName = sap.ui.getCore().byId("editDeptShortName")

        if (!oDeptCode.getValue() || !oDeptName.getValue() || !oDeptShortName.getValue()) {
          MessageBox.error("Please fill in all required fields.")
          return
        }

        var oUpdatedDepartment = {
          DepartmentName: oDeptName.getValue(),
          DepartmentShortName: oDeptShortName.getValue(),
          DepartmentCode: oDeptCode.getValue(),
        }

        fetch("http://localhost:3000/departments/" + oDeptCode.getValue(), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(oUpdatedDepartment),
        })
          .then((response) => response.json())
          .then((data) => {
            console.log("Department updated successfully:", data)
            MessageBox.success("Department updated successfully.")
            this._oEditDepartmentDialog.close()
            this._loadDepartments() // Refresh the department list
          })
          .catch((error) => {
            console.error("Error updating department:", error)
            MessageBox.error("Failed to update department. Please try again.")
          })
      },

      // Employee Management

      // Open add employee dialog
      onAddEmployee: function() {
        // First load departments
        this._loadDepartments().then(() => {
          if (!this._oAddEmployeeDialog) {
            this._oAddEmployeeDialog = sap.ui.xmlfragment(
              "com.emls.view.AddEmployee", 
              this
            );
            this.getView().addDependent(this._oAddEmployeeDialog);
          }
          this._oAddEmployeeDialog.open();
        }).catch(error => {
          MessageBox.error("Failed to load departments");
        });
      },

      // Save new employee
      onSaveEmployee: function () {
        console.log("Saving new employee")
        var oEmployee = {
          EmpId: sap.ui.getCore().byId("empId").getValue(),
          FirstName: sap.ui.getCore().byId("firstName").getValue(),
          LastName: sap.ui.getCore().byId("lastName").getValue(),
          EmailId: sap.ui.getCore().byId("emailId").getValue(),
          Password: sap.ui.getCore().byId("password").getValue(),
          Gender: sap.ui.getCore().byId("gender").getSelectedKey(),
          DateOfBirth: sap.ui.getCore().byId("dateOfBirth").getDateValue(),
          Department: sap.ui.getCore().byId("department").getSelectedKey(),
          Address: sap.ui.getCore().byId("address").getValue(),
          City: sap.ui.getCore().byId("city").getValue(),
          Country: sap.ui.getCore().byId("country").getValue(),
          Status: sap.ui.getCore().byId("status").getSelectedKey(),
        }

        if (
          !oEmployee.EmpId ||
          !oEmployee.FirstName ||
          !oEmployee.LastName ||
          !oEmployee.EmailId ||
          !oEmployee.Password ||
          !oEmployee.Gender ||
          !oEmployee.DateOfBirth ||
          !oEmployee.Department ||
          !oEmployee.Status
        ) {
          MessageBox.error("Please fill in all required fields.")
          return
        }

        fetch("http://localhost:3000/employees", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(oEmployee),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.message === "Employee created successfully") {
              MessageBox.success("Employee added successfully.", {
                onClose: function () {
                  this._oAddEmployeeDialog.close()
                  this._loadEmployees() // Refresh the employee list
                }.bind(this),
              })
            } else {
              MessageBox.error(data.message || "Failed to add employee. Please try again.")
            }
          })
          .catch((error) => {
            console.error("Error:", error)
            MessageBox.error("An error occurred. Please try again.")
          })
      },

      // Cancel add employee
      onCancelAddEmployee: function () {
        console.log("Cancelling add employee")
        this._oAddEmployeeDialog.close()
      },

      // Open manage employees dialog
      onManageEmployees: function () {
        console.log("Opening manage employees dialog")
        if (!this._oManageEmployeesDialog) {
          this._oManageEmployeesDialog = sap.ui.xmlfragment("com.emls.view.ManageEmployees", this)
          this.getView().addDependent(this._oManageEmployeesDialog)
        }
        this._oManageEmployeesDialog.open()
      },

      // Edit employee
      onEditEmployee: function (oEvent) {
        console.log("Editing employee")
        var oContext = oEvent.getSource().getBindingContext()
        var oEmployee = oContext.getObject()

        if (!this._oEditEmployeeDialog) {
          this._oEditEmployeeDialog = sap.ui.xmlfragment("com.emls.view.EditEmployee", this)
          this.getView().addDependent(this._oEditEmployeeDialog)
        }

        // Set the employee data to the form
        sap.ui.getCore().byId("editEmpId").setValue(oEmployee.EmpId)
        sap.ui.getCore().byId("editFirstName").setValue(oEmployee.FirstName)
        sap.ui.getCore().byId("editLastName").setValue(oEmployee.LastName)
        sap.ui.getCore().byId("editEmailId").setValue(oEmployee.EmailId)
        sap.ui.getCore().byId("editGender").setSelectedKey(oEmployee.Gender)
        sap.ui.getCore().byId("editDateOfBirth").setDateValue(new Date(oEmployee.DateOfBirth))
        sap.ui.getCore().byId("editDepartment").setSelectedKey(oEmployee.Department)
        sap.ui.getCore().byId("editAddress").setValue(oEmployee.Address)
        sap.ui.getCore().byId("editCity").setValue(oEmployee.City)
        sap.ui.getCore().byId("editCountry").setValue(oEmployee.Country)
        sap.ui.getCore().byId("editStatus").setSelectedKey(oEmployee.Status)

        this._oEditEmployeeDialog.open()
      },

      // Delete employee
      onDeleteEmployee: function (oEvent) {
        console.log("Deleting employee")
        var oContext = oEvent.getSource().getBindingContext()
        var oEmployee = oContext.getObject()
        MessageBox.confirm("Are you sure you want to delete " + oEmployee.FirstName + " " + oEmployee.LastName + "?", {
          onClose: function (oAction) {
            if (oAction === MessageBox.Action.OK) {
              fetch("http://localhost:3000/employees/" + oEmployee.EmpId, {
                method: "DELETE",
              })
                .then((response) => response.json())
                .then((data) => {
                  if (data.message === "Employee deleted successfully") {
                    MessageBox.success("Employee deleted successfully.")
                    this._loadEmployees() // Refresh the employee list
                  } else {
                    MessageBox.error(data.message || "Failed to delete employee. Please try again.")
                  }
                })
                .catch((error) => {
                  console.error("Error:", error)
                  MessageBox.error("An error occurred. Please try again.")
                })
            }
          }.bind(this),
        })
      },

      // Close manage employees dialog
      onCloseManageEmployees: function () {
        console.log("Closing manage employees dialog")
        this._oManageEmployeesDialog.close()
      },

      // Logout function
      onLogOut: function () {
        console.log("Logout requested")
        // Handle logout action
        MessageBox.confirm("Are you sure you want to log out?", {
          onClose: function (oAction) {
            if (oAction === MessageBox.Action.OK) {
              // Navigate to MainView
              var oRouter = sap.ui.core.UIComponent.getRouterFor(this)
              oRouter.navTo("RouteMainView")
            }
          }.bind(this),
        })
      },

      // Search function
      onSearch: (oEvent) => {
        var sQuery = oEvent.getParameter("newValue")
        console.log("Search requested with query:", sQuery)
        // Implement search functionality
        MessageBox.information("Search feature will be implemented soon. Query: " + sQuery)
      },

      // Open new leave request dialog
      onNewLeaveRequest: function () {
        console.log("Opening new leave request dialog")
        if (!this._oNewLeaveDialog) {
          Fragment.load({
            name: "com.emls.view.NewLeaveRequest",
            controller: this,
          }).then(
            function (oDialog) {
              this._oNewLeaveDialog = oDialog
              this.getView().addDependent(this._oNewLeaveDialog)
              this._oNewLeaveDialog.open()
            }.bind(this),
          )
        } else {
          this._oNewLeaveDialog.open()
        }
      },

      // Modified method to show remarks dialog before approving
      onApproveLeave: function (oEvent) {

        var oSource = oEvent.getSource();
        var oContext = oSource.getBindingContext(); // Remove "leaveRequests"
        var oLeaveRequest = oContext.getObject();
        
        // Store in currentLeaveRequest model
        this.getView().getModel("currentLeaveRequest").setData({
          request: oLeaveRequest,
          action: "approve"
        });
        console.log("Approving leave request:Is approved pressed", oLeaveRequest);
        this._showRemarksDialog();
      },

      // Modified method to show remarks dialog before rejecting
      onRejectLeave: function (oEvent) {
        var oContext = oEvent.getSource().getBindingContext();
        if (oContext) {
          var oLeaveRequest = oContext.getObject()
          // Store the current leave request and action in the model
          this.getView().getModel("currentLeaveRequest").setData({
            request: oLeaveRequest,
            action: "reject",
          })
          this._showRemarksDialog()
        } else {
          console.error("Binding context is undefined")
          MessageBox.error("An error occurred while processing your request. Please try again.")
        }
      },

      // New method to show the remarks dialog
      // In _showRemarksDialog function:
_showRemarksDialog: function() {
  if (!this._oRemarksDialog) {
      this._oRemarksDialog = sap.ui.xmlfragment("com.emls.view.AdminRemarks", this);
      console.log("Remarks dialog created:", this._oRemarksDialog);
      this.getView().addDependent(this._oRemarksDialog);
  }
  
  // Set dialog content based on action
  const oModel = this.getView().getModel("currentLeaveRequest");
  const sAction = oModel.getProperty("/action");
  
  oModel.setProperty("/dialogTitle", 
      sAction === "approve" ? "Approve Leave Request" : "Reject Leave Request");
  
  oModel.setProperty("/actionMessage", 
      sAction === "approve" 
          ? "You are approving this leave request. Please provide approval remarks:"
          : "You are rejecting this leave request. Please provide rejection reason:");

  this._oRemarksDialog.open();
},

// Modified cancel handler
onCancelRemarks: function() {
  MessageBox.confirm(
      "Are you sure you want to cancel? This request will remain in pending status.",
      {
          title: "Cancel Remarks",
          onClose: function(oAction) {
              if (oAction === MessageBox.Action.OK) {
                  const oData = this.getView().getModel("currentLeaveRequest").getData();
                  console.log("Cancelling request:", oData.request);
                  this._updateLeaveStatus(oData.request.id, 2); // Set to pending
                  this._oRemarksDialog.close();
              }
          }.bind(this)
      }
  );
},

      // New method to handle remarks submission
      onSubmitRemarks: function () {
        // Use this.byId to access fragment controls
        var sRemarks = sap.ui.getCore().byId("adminRemarks").getValue()
        console.log("Submitting remarks:", sRemarks)
        var oCurrentLeaveRequest = this.getView().getModel("currentLeaveRequest").getData();

        if (!sRemarks) {
          MessageBox.error("Please enter remarks.");
          return;
        }

        var newStatus = oCurrentLeaveRequest.action === "approve" ? 1 : 3;
        this._updateLeaveStatus(oCurrentLeaveRequest.request.id, newStatus, sRemarks);
        this._oRemarksDialog.close();
      },

      // Modified method to update leave status with remarks
      _updateLeaveStatus: function (leaveId, newStatus, remarks) {
        const oModel = this.getView().getModel();
        const aLeaveRequests = oModel.getProperty("/NewRequests").concat(
          oModel.getProperty("/PendingRequests"),
          oModel.getProperty("/ApprovedRequests"),
          oModel.getProperty("/RejectedRequests")
        );
      
        const oLeaveRequest = aLeaveRequests.find(request => request.id === leaveId);
         console.log("Updating leave request:", oLeaveRequest)
         console.log("What is this remarks:",remarks)
        if (!oLeaveRequest) {
          MessageBox.error("Leave request not found in local data");
          return;
        }
      
        const payload = {
          Status: newStatus,
          AdminRemark: remarks,
          LeaveType: oLeaveRequest.leaveType,
          FromDate: oLeaveRequest.startDate,
          IsRead: 1,
          ToDate: oLeaveRequest.endDate,
          Description: oLeaveRequest.description,
          empid: oLeaveRequest.empid
        };
      
        fetch(`http://localhost:3000/leave/${leaveId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
          console.log("Update response:", data);
          this._loadLeaveRequests();
        })
        .catch(error => {
          console.error("Update error:", error);
          MessageBox.error("Update failed: " + error.message);
        });
      },

      // Load employees from server
      _loadEmployees: function () {
        console.log("Loading employees from server")
        fetch("http://localhost:3000/employees")
          .then((response) => response.json())
          .then((data) => {
            console.log("Employees loaded:", data)
            var oModel = this.getView().getModel()
            oModel.setProperty("/Employees", data)
          })
          .catch((error) => {
            console.error("Error loading employees:", error)
            MessageBox.error("Failed to load employees. Please try again.")
          })
      },

      // Save edited employee
      onSaveEditEmployee: function () {
        console.log("Saving edited employee")
        var oEmployee = {
          EmpId: sap.ui.getCore().byId("editEmpId").getValue(),
          FirstName: sap.ui.getCore().byId("editFirstName").getValue(),
          LastName: sap.ui.getCore().byId("editLastName").getValue(),
          EmailId: sap.ui.getCore().byId("editEmailId").getValue(),
          Gender: sap.ui.getCore().byId("editGender").getSelectedKey(),
          DateOfBirth: sap.ui.getCore().byId("editDateOfBirth").getDateValue(),
          Department: sap.ui.getCore().byId("editDepartment").getSelectedKey(),
          Address: sap.ui.getCore().byId("editAddress").getValue(),
          City: sap.ui.getCore().byId("editCity").getValue(),
          Country: sap.ui.getCore().byId("editCountry").getValue(),
          Status: sap.ui.getCore().byId("editStatus").getSelectedKey(),
        }

        fetch("http://localhost:3000/employees/" + oEmployee.EmpId, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(oEmployee),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.message === "Employee updated successfully") {
              MessageBox.success("Employee updated successfully.", {
                onClose: function () {
                  this._oEditEmployeeDialog.close()
                  this._loadEmployees() // Refresh the employee list
                }.bind(this),
              })
            } else {
              MessageBox.error(data.message || "Failed to update employee. Please try again.")
            }
          })
          .catch((error) => {
            console.error("Error:", error)
            MessageBox.error("An error occurred. Please try again.")
          })
      },

      // Load leave types from server
      _loadLeaveTypes: function () {
        console.log("Loading leave types from server")
        fetch("http://localhost:3000/leavetype")
          .then((response) => response.json())
          .then((data) => {
            console.log("Leave types loaded:", data)
            var oModel = this.getView().getModel()
            oModel.setProperty("/LeaveTypes", data)
          })
          .catch((error) => {
            console.error("Error loading leave types:", error)
            MessageBox.error("Failed to load leave types. Please try again.")
          })
      },

      // Get leave type name by ID
      getLeaveTypeName: function (leaveTypeId) {
        console.log("Getting leave type name for ID:", leaveTypeId)
        var aLeaveTypes = this.getView().getModel().getProperty("/LeaveTypes")
        var oLeaveType = aLeaveTypes.find((oLeaveType) => oLeaveType.id === leaveTypeId)
        return oLeaveType ? oLeaveType.LeaveType : "Unknown"
      },

      //format date
      formatDate: function (dateString) {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString();
      }
    }),
)