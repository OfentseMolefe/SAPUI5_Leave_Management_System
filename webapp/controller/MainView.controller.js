sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/ui/core/Fragment", "sap/m/MessageBox", "sap/ui/model/json/JSONModel"],
  (Controller, Fragment, MessageBox, JSONModel) =>
    Controller.extend("com.emls.controller.MainView", {

      onInit: function () {
        this.setupSessionTimer();
      },

      onApplyLeavePress: function () {
        this.openLoginPopup();
      },

      openLoginPopup: function () {
        var oView = this.getView();

        if (!this.pLoginDialog) {
          this.pLoginDialog = Fragment.load({
            id: oView.getId(),
            name: "com.emls.view.Login",
            controller: this,
          }).then((oDialog) => {
            oView.addDependent(oDialog);
            return oDialog;
          });
        }

        this.pLoginDialog.then((oDialog) => {
          oDialog.getContent()[0].getItems()[3].setValue("");
          oDialog.getContent()[0].getItems()[5].setValue("");
          oDialog.open();
        });
      },

      onLogin: function (oEvent) {
        var oDialog = oEvent.getSource().getParent();
        var sRole = oDialog.getContent()[0].getItems()[1].getSelectedKey();
        var sEmail = oDialog.getContent()[0].getItems()[3].getValue();
        var sPassword = oDialog.getContent()[0].getItems()[5].getValue();

        if (sRole === "employee") {
          this.loginEmployee(sEmail, sPassword, oDialog);
        } else if (sRole === "admin") {
          this.loginAdmin(sEmail, sPassword, oDialog);
        } else {
          MessageBox.error("Please select a role.");
        }
      },

      loginEmployee: function (sEmail, sPassword, oDialog) {
        fetch("http://localhost:3000/login/employee", {
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
              const { Password, ...sanitizedUser } = data.employee;
              var oUserModel = new JSONModel(sanitizedUser);
              this.getOwnerComponent().setModel(oUserModel, "userData");

              localStorage.setItem("userData", JSON.stringify(sanitizedUser));
              localStorage.setItem("userRole", "employee");

              this.resetSessionTimer();
              this.getOwnerComponent().getRouter().navTo("RouteApply");
              oDialog.close();
            } else {
              MessageBox.error("Invalid employee credentials. Please try again.");
            }
          })
          .catch((error) => {
            console.error("Error:", error);
            MessageBox.error("An error occurred. Please try again.");
          });
      },

      loginAdmin: function (sEmail, sPassword, oDialog) {
        fetch("http://localhost:3000/login/admin", {
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
              const { Password, ...sanitizedAdmin } = data.admin;
              this.getOwnerComponent().setModel(new JSONModel(sanitizedAdmin), "adminData");

              localStorage.setItem("adminData", JSON.stringify(sanitizedAdmin));
              localStorage.setItem("userRole", "admin");

              this.resetSessionTimer();
              this.getOwnerComponent().getRouter().navTo("RouteAdmin");
              oDialog.close();
            } else {
              MessageBox.error("Invalid admin credentials. Please try again.");
            }
          })
          .catch((error) => {
            console.error("Error:", error);
            MessageBox.error("An error occurred. Please try again.");
          });
      },

      onCancelLogin: function (oEvent) {
        oEvent.getSource().getParent().close();
      },

      setupSessionTimer: function () {
        var that = this;
        this._sessionTimeout = setTimeout(function () {
          that.autoLogout();
        }, 15 * 60 * 1000);
      },

      resetSessionTimer: function () {
        clearTimeout(this._sessionTimeout);
        this.setupSessionTimer();
      },

      autoLogout: function () {
        MessageBox.warning("Session expired. You will be logged out.", {
          onClose: function () {
            sap.ui.getCore().byId("appComponent").getController().onLogOut();
          },
        });
      },
    })
);
