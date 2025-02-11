sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/core/format/DateFormat",
    "sap/ui/unified/Calendar",
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageBox, Fragment, DateFormat, Calendar, JSONModel) {
    "use strict";

    return Controller.extend("com.emls.controller.Apply", {
        onInit: function () {
            // Initialize controller
            this._loadEmployeeData();
        },

        _loadEmployeeData: function() {
            // In a real application, you would fetch this data from a service
            var oEmployeeData = {
                fullName: "John Doe",
                gender: "Male",
                department: "IT",
                dateOfBirth: new Date(1990, 0, 1),
                phone: "+1234567890",
                address: "123 Main St, Anytown, USA",
                registrationDate: new Date(2020, 0, 1)
            };
            this.getView().setModel(new JSONModel(oEmployeeData), "employee");
        },

        onOpenMenu: function () {
            if (!this._oMenu) {
                this._oMenu = sap.ui.xmlfragment("com.emls.view.SidebarMenu", this);
                this.getView().addDependent(this._oMenu);
            }
            this._oMenu.open();
        },

        onCloseMenu: function () {
            this._oMenu.close();
        },

        onMyProfile: function () {
            if (!this._oProfileDialog) {
                this._oProfileDialog = sap.ui.xmlfragment("com.emls.view.EmployeeProfile", this);
                this.getView().addDependent(this._oProfileDialog);
            }
            this._oProfileDialog.open();
        },

        onCloseProfile: function () {
            this._oProfileDialog.close();
        },

        onChangePassword: function () {
            if (!this._oChangePasswordDialog) {
                this._oChangePasswordDialog = sap.ui.xmlfragment("com.emls.view.ChangePassword", this);
                this.getView().addDependent(this._oChangePasswordDialog);
            }
            this._oChangePasswordDialog.open();
        },

        onSubmitChangePassword: function () {
            var oCurrentPassword = sap.ui.getCore().byId("currentPassword");
            var oNewPassword = sap.ui.getCore().byId("newPassword");
            var oConfirmPassword = sap.ui.getCore().byId("confirmPassword");

            if (!oCurrentPassword.getValue() || !oNewPassword.getValue() || !oConfirmPassword.getValue()) {
                MessageBox.error("Please fill in all fields.");
                return;
            }

            if (oNewPassword.getValue() !== oConfirmPassword.getValue()) {
                MessageBox.error("New password and confirm password do not match.");
                return;
            }

            // Add logic to change password here
            // For example, call a service to update the password

            MessageBox.success("Password changed successfully.", {
                onClose: function () {
                    this._oChangePasswordDialog.close();
                }.bind(this)
            });
        },

        onCancelChangePassword: function () {
            this._oChangePasswordDialog.close();
        },

        onViewCalendar: function () {
            if (!this._oCalendarDialog) {
                this._oCalendarDialog = sap.ui.xmlfragment("com.emls.view.Calendar", this);
                this.getView().addDependent(this._oCalendarDialog);
            }
            this._oCalendarDialog.open();
        },

        onCloseCalendar: function () {
            this._oCalendarDialog.close();
        },

        onLogOut: function() {
            MessageBox.confirm("Are you sure you want to log out?", {
                onClose: function(oAction) {
                    if (oAction === MessageBox.Action.OK) {
                        // Navigate to MainView
                        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                        oRouter.navTo("RouteMainView");
                    }
                }.bind(this)
            });
        },

        onViewLeaveDetails: function () {
            if (!this._oLeaveDetails) {
                this._oLeaveDetails = sap.ui.xmlfragment("com.emls.view.LeaveDetails", this);
                this.getView().addDependent(this._oLeaveDetails);
            }
            // Update leave details here
            // In a real application, you would fetch this data from a service
            var oLeaveDetails = new JSONModel({
                status: "Pending",
                adminRemarks: "Under review"
            });
            this._oLeaveDetails.setModel(oLeaveDetails);
            this._oLeaveDetails.open();
        },

        onCloseLeaveDetails: function () {
            this._oLeaveDetails.close();
        },

        onOpenApplyLeave: function () {
            if (!this._oApplyLeave) {
                this._oApplyLeave = sap.ui.xmlfragment("com.emls.view.ApplyLeave", this);
                this.getView().addDependent(this._oApplyLeave);
            }
            this._oApplyLeave.open();
        },

        onCloseApplyLeave: function () {
            this._oApplyLeave.close();
        },

        onSubmitLeave: function () {
            var oLeaveType = sap.ui.getCore().byId("leaveType");
            var oFromDate = sap.ui.getCore().byId("fromDate");
            var oToDate = sap.ui.getCore().byId("toDate");
            var oDescription = sap.ui.getCore().byId("description");

            if (!oLeaveType.getSelectedKey() || !oFromDate.getDateValue() || !oToDate.getDateValue() || !oDescription.getValue()) {
                MessageBox.error("Please fill in all required fields.");
                return;
            }

            if (oFromDate.getDateValue() > oToDate.getDateValue()) {
                MessageBox.error("From Date must be earlier than or equal to To Date.");
                return;
            }

            // Submit leave application logic here
            // In a real application, you would send this data to a service

            MessageBox.success("Leave application submitted successfully.", {
                onClose: function () {
                    this.onCloseApplyLeave();
                    // Update leave status
                    this.getView().byId("leaveStatus").setText("Pending");
                }.bind(this)
            });
        },

        formatDate: function(oDate) {
            if (oDate) {
                var oDateFormat = DateFormat.getDateInstance({style: "medium"});
                return oDateFormat.format(oDate);
            }
            return "";
        }
    });
});