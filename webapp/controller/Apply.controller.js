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
        this._loadLeaveStatus()

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
        console.log("Employee Data:",oUserData)
      },

      _loadLeaveTypes: function () {
        fetch("http://localhost:3000/leavetype")
          .then((response) => response.json())
          .then((data) => {
            var oLeaveTypesModel = new JSONModel(data)
            this.getView().setModel(oLeaveTypesModel, "leaveTypes")
          })
          .catch((error) => {
            console.error("Error fetching leave types:", error)
            MessageBox.error("Failed to load leave types. Please try again.")
          })
      },

      _loadLeaveStatus: function () {
        var oUserData = this.getView().getModel("employee").getData()
        console.log("leave status",oUserData)
        fetch(`http://localhost:3000/leave/employee/${oUserData.id}`)
          .then((response) => response.json())
          .then((data) => {
            var latestLeave = data[data.length - 1]
            if (latestLeave) {
              this.getView().getModel("employee").setProperty("/leaveStatus", latestLeave.Status)
            } else {
              this.getView().getModel("employee").setProperty("/leaveStatus", "")
            }
          })
          .catch((error) => {
            console.error("Error fetching leave status:", error)
            MessageBox.error("Failed to load leave status. Please try again.")
          })
      },

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
        var oLeaveApplicationModel = this.getView().getModel("leaveApplication")
        var oLeaveData = oLeaveApplicationModel.getData()
        var oUserData = this.getView().getModel("employee").getData()

        if (!oLeaveData.LeaveType || !oLeaveData.FromDate || !oLeaveData.ToDate || !oLeaveData.Description) {
          MessageBox.error("Please fill in all required fields.")
          return
        }

        if (oLeaveData.FromDate > oLeaveData.ToDate) {
          MessageBox.error("From Date must be earlier than or equal to To Date.")
          return
        }

        fetch("http://localhost:3000/leave", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            LeaveType: oLeaveData.LeaveType,
            FromDate: oLeaveData.FromDate,
            ToDate: oLeaveData.ToDate,
            Description: oLeaveData.Description,
            empid: oUserData.id,
          }),
        })
          .then((response) => response.json())
          .then((data) => {
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
            console.error("Error:", error)
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