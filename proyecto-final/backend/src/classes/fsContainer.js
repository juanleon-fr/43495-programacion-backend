const fs = require('fs');

const errMessage = (err, func) => {
	console.log(`Se ha producido un error al ejecutar ${func}\n ${err}`);
};

class FsContainer {
	constructor(route) {
		this.fileName = route;
	}

	assignId = async () => {
		let id;
		const thisList = await this.getAll();
		if (thisList.length === 0) {
			id = 1;
		} else {
			const lastElement = thisList.slice(-1)[0];
			id = lastElement.id + 1;
		}
		return id;
	};

	getAll = async () => {
		try {
			console.log(this.fileName);
			const file = await fs.promises.readFile(`./${this.fileName}`, 'utf-8');
			const list = JSON.parse(file);
			return list;
		} catch (err) {
			errMessage(err, 'getAll');
		}
	};

	getById = async (id) => {
		try {
			const list = await this.getAll();
			const itemFound = list.find((element) => element.id === Number(id));
			if (itemFound) return itemFound;
			return { error: 'producto no encontrado' };
		} catch (err) {
			errMessage(err, 'getById');
		}
	};

	save = async (obj) => {
		try {
			obj.id = await this.assignId();
			obj.timestamp = Date.now();
			list.push(obj);
			await fs.promises.writeFile(`./${this.fileName}`, JSON.stringify(list));
			return obj;
		} catch (err) {
			errMessage(err, 'save');
		}
	};

	updateById = async (id, body) => {
		try {
			let result = await this.getById(id);
			if (result.error === 'producto no encontrado') {
				return result;
			}
			let list = await this.getAll();
			const itemIndex = list.findIndex((element) => element.id === Number(id));
			const setItem = { ...body };
			delete setItem.id;
			if (body.price !== undefined) {
				if (isNaN(body.price)) return { error: 'El precio debe ser un número válido' };
				setItem.price = Number(body.price);
			}
			if (body.stock !== undefined) {
				if (isNaN(body.stock)) return { error: 'El stock debe ser un número válido' };
				setItem.stock = Number(body.stock);
			}
			list[itemIndex] = {
				...list[itemIndex],
				...setItem,
			};
			list[itemIndex].timestamp = Date.now();
			await fs.promises.writeFile(`./${this.fileName}`, JSON.stringify(list));
			return 'updated';
		} catch (err) {
			errMessage(err, 'save');
		}
	};

	deleteById = async (id) => {
		try {
			let result = await this.getById(id);
			if (result.error === 'producto no encontrado') {
				return result;
			}
			let list = await this.getAll();
			const newList = list.filter((element) => element.id !== Number(id));
			await fs.promises.writeFile(`./${this.fileName}`, JSON.stringify(newList));
			return 'deleted';
		} catch (err) {
			errMessage(err, 'deleteById');
		}
	};

	deleteAll = async () => {
		try {
			fs.promises.writeFile(`./${this.fileName}`, JSON.stringify([]));
		} catch (err) {
			errMessage(err, 'deleteAll');
		}
	};

	newCart = async (body) => {
		let cart = {};
		cart.id = await this.assignId();
		cart.timestamp = Date.now();
		cart.productos = body.productos;
		return this.save(cart);
	};

	addToCart = async (id, id_prod) => {
		const productList = require('../db/productos.json');
		const producto = productList.find((element) => element.id == id_prod);
		let cart = await this.getById(id);
		if (cart.hasOwnProperty('error')) return cart;
		let productInCart = cart.productos.find((element) => element.id == producto.id);
		if (typeof productInCart === 'object') return [{ success: false, issue: 'product already in cart' }];
		cart.productos = [...cart.productos, producto];
		return this.save(cart);
	};

	removeFromCart = async (id, id_prod) => {
		let cart = await this.getById(id);
		let productInCart = cart.productos.find((element) => element.id == id_prod);
		if (typeof productInCart !== 'object') return [{ success: false, issue: 'product not present in cart' }];
		cart.productos = cart.productos.filter((element) => element.id != id_prod);
		return this.save(cart);
	};
}

module.exports = FsContainer;
