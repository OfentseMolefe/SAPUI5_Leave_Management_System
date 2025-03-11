sap.ui.define([
    "sap/ui/core/UIComponent",
    "com/emls/model/models"
], (UIComponent, models) => {
    "use strict";

    return UIComponent.extend("com.emls.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // enable routing
            this.getRouter().initialize();
            
            // Check for existing sessions
            const userRole = localStorage.getItem('userRole');
            const router = this.getRouter();

            if (userRole === 'employee' && localStorage.getItem('userData')) {
                router.navTo("RouteApply");
            } else if (userRole === 'admin' && localStorage.getItem('adminData')) {
                router.navTo("RouteAdmin");
            } else {
                router.navTo("RouteMainView");
            }
        }
    });
});