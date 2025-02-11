sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment"
], function (Controller, JSONModel, MessageBox, Fragment) {
    "use strict";

    return Controller.extend("com.emls.controller.Admin", {
        onInit: function () {
            // Initialize the JSON model with sample data
            var oModel = new JSONModel({
                NewRequests: [
                    {
                        employeeName: "Emily Blunt",
                        initials: "EB",
                        leaveType: "Annual Leave",
                        duration: 5,
                        startDate: "2024-04-20",
                        endDate: "2024-04-24",
                        status: "New"
                    },
                    {
                        employeeName: "Richard Briers",
                        initials: "RB",
                        leaveType: "Sick Leave",
                        duration: 2,
                        startDate: "2024-04-22",
                        endDate: "2024-04-23",
                        status: "New"
                    }
                ],
                PendingRequests: [
                    {
                        employeeName: "Kelly Brook",
                        initials: "KB",
                        leaveType: "Annual Leave",
                        duration: 3,
                        startDate: "2024-04-25",
                        endDate: "2024-04-27",
                        status: "Pending",
                        progress: 45
                    },
                    {
                        employeeName: "Tony Britton",
                        initials: "TB",
                        leaveType: "Personal Leave",
                        duration: 1,
                        startDate: "2024-04-28",
                        endDate: "2024-04-28",
                        status: "Pending",
                        progress: 75
                    }
                ],
                ApprovedRequests: [
                    {
                        employeeName: "Kim Cattrall",
                        initials: "KC",
                        leaveType: "Annual Leave",
                        duration: 10,
                        startDate: "2024-05-01",
                        endDate: "2024-05-10",
                        status: "Approved"
                    }
                ],
                RejectedRequests: [
                    {
                        employeeName: "Daniel Craig",
                        initials: "DC",
                        leaveType: "Study Leave",
                        duration: 5,
                        startDate: "2024-05-15",
                        endDate: "2024-05-19",
                        status: "Rejected"
                    }
                ]
            });

            this.getView().setModel(oModel);
            this._loadMockData();
            this._initializeModels();

        },

        onDashboard: function () {
            // Handle dashboard navigation
            MessageBox.information("Dashboard functionality to be implemented.");
        },

        onToggleDepartmentSubmenu: function (oEvent) {
            this._toggleSubmenu(oEvent, "department");
        },

        onToggleEmployeeSubmenu: function (oEvent) {
            this._toggleSubmenu(oEvent, "employee");
        },

        _toggleSubmenu: function (oEvent, submenuClass) {
            var bExpanded = oEvent.getSource().getCustomData()[0].getValue() === "expanded";
            var aSubmenuItems = this.getView().getContent()[0].getMasterPages()[0].getContent()[0].getItems().filter(function (item) {
                return item.hasStyleClass("submenuItem") && item.hasStyleClass(submenuClass);
            });

            aSubmenuItems.forEach(function (item) {
                item.setVisible(!bExpanded);
            });

            oEvent.getSource().getCustomData()[0].setValue(bExpanded ? "collapsed" : "expanded");
        },
        _loadMockData: function () {
            var oModel = new JSONModel({
                Departments: [
                    { DeptCode: "IT", DeptName: "Information Technology", DeptShortName: "IT" },
                    { DeptCode: "HR", DeptName: "Human Resources", DeptShortName: "HR" },
                    { DeptCode: "FIN", DeptName: "Finance", DeptShortName: "FIN" }
                ],
                Employees: [
                    { EmpId: "E001", FirstName: "John", LastName: "Doe", EmailId: "john.doe@example.com", Department: "IT", Status: "Active", Gender: "M", DateOfBirth: new Date(1990, 0, 1), Address: "123 Main St", City: "New York", Country: "USA" },
                    { EmpId: "E002", FirstName: "Jane", LastName: "Smith", EmailId: "jane.smith@example.com", Department: "HR", Status: "Active", Gender: "F", DateOfBirth: new Date(1992, 5, 15), Address: "456 Elm St", City: "London", Country: "UK" }
                ]
            });
            this.getView().setModel(oModel);
        },

        _initializeModels: function () {
            this.getView().setModel(new JSONModel({
                departmentDialogMode: "Add",
                employeeDialogMode: "Add"
            }), "viewModel");
        },

        onDashboard: function () {
            MessageBox.information("Dashboard functionality to be implemented.");
        },

        onToggleDepartmentSubmenu: function (oEvent) {
            this._toggleSubmenu(oEvent, "department");
        },

        onToggleEmployeeSubmenu: function (oEvent) {
            this._toggleSubmenu(oEvent, "employee");
        },

        _toggleSubmenu: function (oEvent, submenuClass) {
            var bExpanded = oEvent.getSource().getCustomData()[0].getValue() === "expanded";
            var aSubmenuItems = this.getView().getContent()[0].getMasterPages()[0].getContent()[0].getItems().filter(function (item) {
                return item.hasStyleClass("submenuItem") && item.hasStyleClass(submenuClass);
            });

            aSubmenuItems.forEach(function (item) {
                item.setVisible(!bExpanded);
            });

            oEvent.getSource().getCustomData()[0].setValue(bExpanded ? "collapsed" : "expanded");
        },

        // Department Management
        onAddDepartment: function() {
            if (!this._oAddDepartmentDialog) {
                this._oAddDepartmentDialog = sap.ui.xmlfragment("com.emls.view.AddDepartment", this);
                this.getView().addDependent(this._oAddDepartmentDialog);
            }
            this._oAddDepartmentDialog.open();
        },

        onSaveDepartment: function() {
            var oDeptCode = sap.ui.getCore().byId("deptCode");
            var oDeptName = sap.ui.getCore().byId("deptName");
            var oDeptShortName = sap.ui.getCore().byId("deptShortName");

            if (!oDeptCode.getValue() || !oDeptName.getValue() || !oDeptShortName.getValue()) {
                MessageBox.error("Please fill in all required fields.");
                return;
            }

            var oModel = this.getView().getModel();
            var aDepartments = oModel.getProperty("/Departments");
            aDepartments.push({
                DeptCode: oDeptCode.getValue(),
                DeptName: oDeptName.getValue(),
                DeptShortName: oDeptShortName.getValue()
            });
            oModel.setProperty("/Departments", aDepartments);

            MessageBox.success("Department added successfully.");
            this._oAddDepartmentDialog.close();
        },

        onCancelAddDepartment: function() {
            this._oAddDepartmentDialog.close();
        },

        onManageDepartments: function() {
            if (!this._oManageDepartmentsDialog) {
                this._oManageDepartmentsDialog = sap.ui.xmlfragment("com.emls.view.ManageDepartments", this);
                this.getView().addDependent(this._oManageDepartmentsDialog);
            }
            this._oManageDepartmentsDialog.open();
        },

        onEditDepartment: function(oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            // Implement edit functionality
            MessageBox.information("Edit department: " + oContext.getProperty("DeptName"));
        },

        onDeleteDepartment: function(oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            var oDepartment = oContext.getObject();
            MessageBox.confirm("Are you sure you want to delete " + oDepartment.DeptName + "?", {
                onClose: function(oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        var oModel = this.getView().getModel();
                        var aDepartments = oModel.getProperty("/Departments");
                        var iIndex = aDepartments.findIndex(function(dept) {
                            return dept.DeptCode === oDepartment.DeptCode;
                        });
                        aDepartments.splice(iIndex, 1);
                        oModel.setProperty("/Departments", aDepartments);
                        MessageBox.success("Department deleted successfully.");
                    }
                }.bind(this)
            });
        },

        onCloseManageDepartments: function() {
            this._oManageDepartmentsDialog.close();
        },


        // Employee Management
        onAddEmployee: function () {
            if (!this._oAddEmployeeDialog) {
                this._oAddEmployeeDialog = sap.ui.xmlfragment("com.emls.view.AddEmployee", this);
                this.getView().addDependent(this._oAddEmployeeDialog);
            }
            this._oAddEmployeeDialog.open();
        },

        onSaveEmployee: function () {
            var oEmployee = {
                EmpId: sap.ui.getCore().byId("empId").getValue(),
                FirstName: sap.ui.getCore().byId("firstName").getValue(),
                LastName: sap.ui.getCore().byId("lastName").getValue(),
                EmailId: sap.ui.getCore().byId("emailId").getValue(),
                Gender: sap.ui.getCore().byId("gender").getSelectedKey(),
                DateOfBirth: sap.ui.getCore().byId("dateOfBirth").getDateValue(),
                Department: sap.ui.getCore().byId("department").getSelectedKey(),
                Address: sap.ui.getCore().byId("address").getValue(),
                City: sap.ui.getCore().byId("city").getValue(),
                Country: sap.ui.getCore().byId("country").getValue(),
                Status: sap.ui.getCore().byId("status").getSelectedKey()
            };

            if (!oEmployee.EmpId || !oEmployee.FirstName || !oEmployee.LastName || !oEmployee.EmailId || !oEmployee.Gender || !oEmployee.DateOfBirth || !oEmployee.Department || !oEmployee.Status) {
                MessageBox.error("Please fill in all required fields.");
                return;
            }

            var oModel = this.getView().getModel();
            var aEmployees = oModel.getProperty("/Employees");
            aEmployees.push(oEmployee);
            oModel.setProperty("/Employees", aEmployees);

            MessageBox.success("Employee added successfully.");
            this._oAddEmployeeDialog.close();
        },

        onCancelAddEmployee: function () {
            this._oAddEmployeeDialog.close();
        },

        onManageEmployees: function () {
            if (!this._oManageEmployeesDialog) {
                this._oManageEmployeesDialog = sap.ui.xmlfragment("com.emls.view.ManageEmployees", this);
                this.getView().addDependent(this._oManageEmployeesDialog);
            }
            this._oManageEmployeesDialog.open();
        },

        onEditEmployee: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            // Implement edit functionality
            MessageBox.information("Edit employee: " + oContext.getProperty("FirstName") + " " + oContext.getProperty("LastName"));
        },

        onDeleteEmployee: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            var oEmployee = oContext.getObject();
            MessageBox.confirm("Are you sure you want to delete " + oEmployee.FirstName + " " + oEmployee.LastName + "?", {
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        var oModel = this.getView().getModel();
                        var aEmployees = oModel.getProperty("/Employees");
                        var iIndex = aEmployees.findIndex(function (emp) {
                            return emp.EmpId === oEmployee.EmpId;
                        });
                        aEmployees.splice(iIndex, 1);
                        oModel.setProperty("/Employees", aEmployees);
                        MessageBox.success("Employee deleted successfully.");
                    }
                }.bind(this)
            });
        },

        onCloseManageEmployees: function () {
            this._oManageEmployeesDialog.close();
        }
        ,

        // Logout Function
        onLogOut: function () {
            // Handle logout action
            MessageBox.confirm("Are you sure you want to log out?", {
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        // Navigate to MainView
                        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                        oRouter.navTo("RouteMainView");
                    }
                }.bind(this)
            });
        },

        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("newValue");
            // Implement search functionality
            MessageBox.information("Search feature will be implemented soon. Query: " + sQuery);
        },

        onNewLeaveRequest: function () {
            if (!this._oNewLeaveDialog) {
                Fragment.load({
                    name: "com.emls.view.NewLeaveRequest",
                    controller: this
                }).then(function (oDialog) {
                    this._oNewLeaveDialog = oDialog;
                    this.getView().addDependent(this._oNewLeaveDialog);
                    this._oNewLeaveDialog.open();
                }.bind(this));
            } else {
                this._oNewLeaveDialog.open();
            }
        },

        onApproveLeave: function (oEvent) {
            var oSource = oEvent.getSource();
            var oContext = oSource.getBindingContext();
            var oLeaveRequest = oContext.getObject();

            MessageBox.confirm("Are you sure you want to approve this leave request?", {
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        // Implement the logic to move the request from NewRequests to ApprovedRequests
                        var oModel = this.getView().getModel();
                        var aNewRequests = oModel.getProperty("/NewRequests");
                        var aApprovedRequests = oModel.getProperty("/ApprovedRequests");

                        var iIndex = aNewRequests.indexOf(oLeaveRequest);
                        if (iIndex > -1) {
                            aNewRequests.splice(iIndex, 1);
                            aApprovedRequests.push(oLeaveRequest);
                            oModel.setProperty("/NewRequests", aNewRequests);
                            oModel.setProperty("/ApprovedRequests", aApprovedRequests);
                        }

                        MessageBox.success("Leave request approved successfully");
                    }
                }.bind(this)
            });
        },

        onRejectLeave: function (oEvent) {
            var oSource = oEvent.getSource();
            var oContext = oSource.getBindingContext();
            var oLeaveRequest = oContext.getObject();

            MessageBox.confirm("Are you sure you want to reject this leave request?", {
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        // Implement the logic to move the request from NewRequests to RejectedRequests
                        var oModel = this.getView().getModel();
                        var aNewRequests = oModel.getProperty("/NewRequests");
                        var aRejectedRequests = oModel.getProperty("/RejectedRequests");

                        var iIndex = aNewRequests.indexOf(oLeaveRequest);
                        if (iIndex > -1) {
                            aNewRequests.splice(iIndex, 1);
                            aRejectedRequests.push(oLeaveRequest);
                            oModel.setProperty("/NewRequests", aNewRequests);
                            oModel.setProperty("/RejectedRequests", aRejectedRequests);
                        }

                        MessageBox.success("Leave request rejected successfully");
                    }
                }.bind(this)
            });
        }
    });
});