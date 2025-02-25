sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/core/format/DateFormat",
    "sap/ui/unified/Calendar",
    "sap/ui/model/json/JSONModel",
  ],
  (Controller, MessageBox, Fragment, DateFormat, Calendar, JSONModel) =>
    Controller.extend("com.emls.controller.Apply", {
      onInit: function () {
        this._loadEmployeeData()
        this._loadLeaveTypes()

        var oLeaveApplicationModel = new JSONModel({
          LeaveType: "",
          FromDate: null,
          ToDate: null,
          Description: "",
        })
        this.getView().setModel(oLeaveApplicationModel, "leaveApplication")
      },

      _loadEmployeeData: function () {
        var oUserData = this.getOwnerComponent().getModel("userData").getData()
        this.getView().setModel(new JSONModel(oUserData), "employee")
        console.log("Employee Data:", oUserData)
      },

      _loadLeaveTypes: function () {
        fetch("http://localhost:3000/leavetype")
          .then((response) => response.json())
          .then((data) => {
            var oLeaveTypesModel = new JSONModel(data)
            this.getView().setModel(oLeaveTypesModel, "leaveTypes")
            this._loadLeaveStatus()
          })
          .catch((error) => {
            console.error("Error fetching leave types:", error)
            MessageBox.error("Failed to load leave types. Please try again.")
          })
      },

      _loadLeaveStatus: function () {
        var oUserData = this.getView().getModel("employee").getData();
        fetch(`http://localhost:3000/leave/employee/${oUserData.id}`)
          .then((response) => response.json())
          .then((data) => {
            var latestLeave = data[data.length - 1];
            if (latestLeave) {
              this.getView().getModel("employee").setProperty(
                "/leaveStatus",
                latestLeave.Status === 0
                  ? "Pending"
                  : latestLeave.Status === 1
                    ? "Approved"
                    : "Rejected"
              );
              console.log("Leave Status:", latestLeave.Status);
            } else {
              this.getView().getModel("employee").setProperty("/leaveStatus", "No Leave applied");
            }
          })
          .catch((error) => {
            console.error("Error fetching leave status:", error);
            MessageBox.error("Failed to load leave status. Please try again.");
          });
      },
      formatLeaveStatus: (status) => {
        switch (Number.parseInt(status)) {
          case 0:
            return "Pending"
          case 1:
            return "Approved"
          case 2:
            return "Rejected"
          default:
            return "Unknown"
        }
      }
      ,
      formatStatusIcon: (status) => {
        switch (Number.parseInt(status)) {
          case 0:
            return "sap-icon://pending"
          case 1:
            return "sap-icon://accept"
          case 2:
            return "sap-icon://decline"
          default:
            return "sap-icon://question-mark"
        }
      }
      ,
      onOpenMenu: function (oEvent) {
        if (!this._oMenu) {
          this._oMenu = sap.ui.xmlfragment("com.emls.view.SidebarMenu", this)
          this.getView().addDependent(this._oMenu)
        }
        var oButton = oEvent.getSource()
        this._oMenu.openBy(oButton)
      },

      onCloseMenu: function () {
        this._oMenu.close()
      },

      onMyProfile: function () {
        if (!this._oProfileDialog) {
          this._oProfileDialog = sap.ui.xmlfragment("com.emls.view.EmployeeProfile", this)
          this.getView().addDependent(this._oProfileDialog)
        }
        this._oProfileDialog.open()
      },

      onCloseProfile: function () {
        this._oProfileDialog.close()
      },

      onChangePassword: function () {
        if (!this._oChangePasswordDialog) {
          this._oChangePasswordDialog = sap.ui.xmlfragment("com.emls.view.ChangePassword", this)
          this.getView().addDependent(this._oChangePasswordDialog)
        }
        this._oChangePasswordDialog.open()
      },

      onSubmitChangePassword: function () {
        var oCurrentPassword = sap.ui.getCore().byId("currentPassword")
        var oNewPassword = sap.ui.getCore().byId("newPassword")
        var oConfirmPassword = sap.ui.getCore().byId("confirmPassword")

        if (!oCurrentPassword.getValue() || !oNewPassword.getValue() || !oConfirmPassword.getValue()) {
          MessageBox.error("Please fill in all fields.")
          return
        }

        if (oNewPassword.getValue() !== oConfirmPassword.getValue()) {
          MessageBox.error("New password and confirm password do not match.")
          return
        }

        var oUserData = this.getView().getModel("employee").getData()

        fetch("http://localhost:3000/employees/" + oUserData.id, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            Password: oNewPassword.getValue(),
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.message === "Employee updated successfully") {
              MessageBox.success("Password changed successfully.", {
                onClose: function () {
                  this._oChangePasswordDialog.close()
                }.bind(this),
              })
            } else {
              MessageBox.error(data.message || "Failed to change password. Please try again.")
            }
          })
          .catch((error) => {
            console.error("Error:", error)
            MessageBox.error("An error occurred. Please try again.")
          })
      },

      onCancelChangePassword: function () {
        this._oChangePasswordDialog.close()
      },

      onViewCalendar: () => {
        MessageBox.information("Calendar view is not implemented yet.")
      },

      onLogOut: function () {
        MessageBox.confirm("Are you sure you want to log out?", {
          onClose: function (oAction) {
            if (oAction === MessageBox.Action.OK) {
              this.getOwnerComponent().setModel(new JSONModel({}), "userData")
              var oRouter = sap.ui.core.UIComponent.getRouterFor(this)
              oRouter.navTo("RouteMainView")
            }
          }.bind(this),
        })
      },

      onViewLeaveDetails: function () {
        if (!this._oLeaveDetails) {
          this._oLeaveDetails = sap.ui.xmlfragment("com.emls.view.LeaveDetails", this)
          this.getView().addDependent(this._oLeaveDetails)
        }

        var oUserData = this.getView().getModel("employee").getData()

        fetch(`http://localhost:3000/leave/${oUserData.id}`)
          .then((response) => response.json())
          .then((data) => {
            var oLeaveDetails = new JSONModel(data)
            this._oLeaveDetails.setModel(oLeaveDetails, "leaveDetails")
            this._oLeaveDetails.open()
          })
          .catch((error) => {
            console.error("Error:", error)
            MessageBox.error("Failed to fetch leave details. Please try again.")
          })
      },

      onCloseLeaveDetails: function () {
        this._oLeaveDetails.close()
      },

      onOpenApplyLeave: function () {
        if (!this._oApplyLeave) {
          this._oApplyLeave = sap.ui.xmlfragment("com.emls.view.ApplyLeave", this)
          this.getView().addDependent(this._oApplyLeave)
        }
        var oLeaveApplicationModel = this.getView().getModel("leaveApplication")
        oLeaveApplicationModel.setData({
          LeaveType: "",
          FromDate: null,
          ToDate: null,
          Description: "",
        })
        this._oApplyLeave.open()
      },

      onCloseApplyLeave: function () {
        this._oApplyLeave.close()
      },

      onSubmitLeave: function () {
        // Get the leave application data from the model
        var oLeaveApplicationModel = this.getView().getModel("leaveApplication")
        var oLeaveData = oLeaveApplicationModel.getData()
        var oUserData = this.getView().getModel("employee").getData()

        console.log("Leave Data before submission:", oLeaveData) // Debug log

        // Validate required fields
        if (
          !oLeaveData.LeaveType ||
          (oLeaveData.LeaveType === "Other" && !oLeaveData.CustomLeaveType) ||
          !oLeaveData.FromDate ||
          !oLeaveData.ToDate ||
          !oLeaveData.Description
        ) {
          MessageBox.error("Please fill in all required fields.")
          return
        }

        // Validate date range
        if (oLeaveData.FromDate > oLeaveData.ToDate) {
          MessageBox.error("From Date must be earlier than or equal to To Date.")
          return
        }

        // Determine the leave type to be sent
        var leaveType = oLeaveData.LeaveType === "Other" ? oLeaveData.CustomLeaveType : oLeaveData.LeaveType

        console.log("Final Leave Type to be submitted:", leaveType) // Debug log

        // Prepare the data to be sent to the server
        var leaveRequestData = {
          LeaveType: leaveType, // This will be the plain text of the leave type
          FromDate: oLeaveData.FromDate,
          ToDate: oLeaveData.ToDate,
          Description: oLeaveData.Description,
          empid: oUserData.id,
        }

        console.log("Leave Request Data:", leaveRequestData) // Debug log

        // Send the leave request to the server
        fetch("http://localhost:3000/leave", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(leaveRequestData),
        })
          .then((response) => response.json())
          .then((data) => {
            console.log("Server response:", data) // Debug log
            if (data.message === "Leave request created successfully") {
              MessageBox.success("Leave application submitted successfully.", {
                onClose: function () {
                  this.onCloseApplyLeave()
                  this._loadLeaveStatus()
                }.bind(this),
              })
            } else {
              MessageBox.error(data.message || "Failed to submit leave application. Please try again.")
            }
          })
          .catch((error) => {
            console.error("Error submitting leave request:", error)
            MessageBox.error("An error occurred. Please try again.")
          })
      },

      formatDate: (oDate) => {
        if (oDate) {
          var oDateFormat = DateFormat.getDateInstance({ style: "medium" })
          return oDateFormat.format(oDate)
        }
        return ""
      },
    }),
)