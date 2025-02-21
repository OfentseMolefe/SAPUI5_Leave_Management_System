sap.ui.define(
    ["sap/ui/core/mvc/Controller", "sap/ui/core/Fragment", "sap/m/MessageBox"],
    (Controller, Fragment, MessageBox) =>
      Controller.extend("com.emls.controller.MainView", {
        onApplyLeavePress: function () {
          this.openLoginPopup()
        },
  
        openLoginPopup: function () {
          var oView = this.getView()
  
          // Load fragment if not already created
          if (!this.pLoginDialog) {
            this.pLoginDialog = Fragment.load({
              id: oView.getId(),
              name: "com.emls.view.Login",
              controller: this,
            }).then((oDialog) => {
              oView.addDependent(oDialog)
              return oDialog
            })
          }
  
          this.pLoginDialog.then((oDialog) => {
            // Reset input fields
            oDialog.getContent()[0].getItems()[3].setValue("")
            oDialog.getContent()[0].getItems()[5].setValue("")
            oDialog.open()
          })
        },
  
        onLogin: function (oEvent) {
          var oDialog = oEvent.getSource().getParent()
          var sRole = oDialog.getContent()[0].getItems()[1].getSelectedKey()
          var sEmail = oDialog.getContent()[0].getItems()[3].getValue()
          var sPassword = oDialog.getContent()[0].getItems()[5].getValue()
  
          if (sRole === "employee") {
            this.loginEmployee(sEmail, sPassword, oDialog)
          } else if (sRole === "admin") {
            this.loginAdmin(sEmail, sPassword, oDialog)
          } else {
            MessageBox.error("Please select a role.")
          }
        },
  
        loginEmployee: function (sEmail, sPassword, oDialog) {
          fetch("/api/login/employee", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              EmailId: sEmail,
              Password: sPassword,
            }),
          })
            .then((response) => response.json())
            .then((data) => {
              if (data.message === "Login successful") {
                oDialog.close()
                this.getOwnerComponent().getRouter().navTo("RouteApply")
              } else {
                MessageBox.error("Invalid employee credentials. Please try again.")
              }
            })
            .catch((error) => {
              console.error("Error:", error)
              MessageBox.error("An error occurred. Please try again.")
            })
        },
  
        loginAdmin: function (sEmail, sPassword, oDialog) {
          fetch("/api/login/admin", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              UserName: sEmail,
              Password: sPassword,
            }),
          })
            .then((response) => response.json())
            .then((data) => {
              if (data.message === "Login successful") {
                oDialog.close()
                this.getOwnerComponent().getRouter().navTo("RouteAdmin")
              } else {
                MessageBox.error("Invalid admin credentials. Please try again.")
              }
            })
            .catch((error) => {
              console.error("Error:", error)
              MessageBox.error("An error occurred. Please try again.")
            })
        },
  
        onCancelLogin: (oEvent) => {
          oEvent.getSource().getParent().close()
        },
      }),
  )
    