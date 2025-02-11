sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox"
], function (Controller, Fragment, MessageBox) {
    "use strict";

    return Controller.extend("com.emls.controller.MainView", {
        onApplyLeavePress: function () {
            this.openLoginPopup();
        },

        onAdminLoginPress: function () {
            this.openLoginPopup();
        },

        openLoginPopup: function () {
            var oView = this.getView();

            // Load fragment if not already created
            if (!this.pLoginDialog) {
                this.pLoginDialog = Fragment.load({
                    id: oView.getId(),
                    name: "com.emls.view.Login",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }

            this.pLoginDialog.then(function (oDialog) {
                oDialog.open();
            });
        },

        onLogin: function (oEvent) {
            var oDialog = oEvent.getSource().getParent();
            var sRole = oDialog.getContent()[0].getItems()[1].getSelectedKey();
            var sEmail = oDialog.getContent()[0].getItems()[3].getValue();
            var sPassword = oDialog.getContent()[0].getItems()[5].getValue();

            // Simple mock validation (Replace with OData authentication)
            if (sRole === "employee" && sEmail === "emp@ex.com" && sPassword === "pass123") {
                oDialog.close();
                this.getOwnerComponent().getRouter().navTo("RouteApply");
            } else if (sRole === "admin" && sEmail === "admin@ex.com" && sPassword === "admin123") {
                oDialog.close();
                this.getOwnerComponent().getRouter().navTo("RouteAdmin");
            } else {
                MessageBox.error("Invalid credentials. Please try again.");
            }
        },

        onCancelLogin: function (oEvent) {
            oEvent.getSource().getParent().close();
        }
    });
});
