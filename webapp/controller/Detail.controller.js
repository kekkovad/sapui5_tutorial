sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
],
    function (Controller, MessageBox, MessageToast, JSONModel, Fragment) {
        "use strict";
        var productID = undefined;

        return Controller.extend("sap.btp.sapui5.controller.Detail", {

            onInit: function () {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.getRoute("detail").attachMatched(this._onRouteMatched, this);
            },
            _onRouteMatched: function (oEvent) {
                var oArgs, oView;
                oArgs = oEvent.getParameter("arguments");
                productID = oArgs.productId;
                oView = this.getView();
                oView.bindElement({
                    path: "/Products(" + oArgs.productId + ")",
                    events: {
                        dataRequested: function () {
                            oView.setBusy(true);
                        },
                        dataReceived: function () {
                            oView.setBusy(false);
                        }
                    }
                });
            },
            handleNavButtonPress: function (evt) {
                productID = undefined;
                this.getView().setModel(new JSONModel({}), "SupplierInfoModel");
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("home");
            },
            handleOrder: function (evt) {
                // show confirmation dialog
                var bundle = this.getView().getModel("i18n").getResourceBundle();
                MessageBox.confirm(
                    bundle.getText("OrderDialogMsg"),
                    function (oAction) {
                        if (MessageBox.Action.OK === oAction) {
                            // notify user
                            var successMsg = bundle.getText("OrderDialogSuccessMsg");
                            MessageToast.show(successMsg);
                            // TODO call proper service method and update model (not part of this tutorial)
                        }
                    },
                    bundle.getText("OrderDialogTitle")
                );
            },
            getSupplierInfo: function () {
                var that = this;
                sap.ui.getCore().sapAppID = this.getOwnerComponent()
                    .getMetadata()
                    .getManifest()["sap.app"].id;
                var url = "/V2/Northwind/Northwind%2esvc/Products(" + productID + ")/Supplier"; //Northwind.svc
                url = jQuery.sap.getModulePath(sap.ui.getCore().sapAppID + url);
                //open dialog
                // load BusyDialog fragment asynchronously
			if (!this._pBusyDialog) {
				this._pBusyDialog = Fragment.load({
					name: "sap.btp.sapui5.view.SupplierInfoDialog",
					controller: this
				}).then(function (oBusyDialog) {
					this.getView().addDependent(oBusyDialog);
					//syncStyleClass("sapUiSizeCompact", this.getView(), oBusyDialog);
					return oBusyDialog;
				}.bind(this));
			}

			this._pBusyDialog.then(function(oBusyDialog) {
				oBusyDialog.open();
				
			}.bind(this));
                //
                return new Promise(function (resolve, reject) {
                    jQuery.ajax({
                        url: url,
                        type: "GET",
                        dataType: "json",
                        success: function (result) {
                            that.getView().setModel(new JSONModel(result.d), "SupplierInfoModel");
                            return resolve(result.d);
                        },
                        error: function (e) {
                            // log error in browser
                            console.log(e.message);
                            return reject(e);
                        },
                    });
                });
            },

            closeDialog: function(){
                this._pBusyDialog.then(function(oBusyDialog) {
                    oBusyDialog.close();
                }.bind(this));
            }

        });
    });
