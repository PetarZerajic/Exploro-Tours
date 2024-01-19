const { AppError } = require("../utils/appError");
const { ApiFeatures } = require("../utils/apiFeatures");

const createOne = (Model) => async (req, res, next) => {
  try {
    const document = await Model.create(req.body);

    res.status(201).json({
      status: "success",
      data: document,
    });
  } catch (err) {
    next(err);
  }
};

const getAll = (Model) => async (req, res, next) => {
  try {
    let filterObj = {};
    const { tourId } = req.params;
    if (tourId) filterObj = { tour: tourId };
    const features = new ApiFeatures(Model.find(filterObj), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const document = await features.query;

    res.status(200).json({
      status: "success",
      results: document.length,
      data: {
        document,
      },
    });
  } catch (err) {
    next(err);
  }
};
const getOne = (Model, popOptions) => async (req, res, next) => {
  try {
    let query = Model.findById(req.params.id);

    if (popOptions) query = query.populate(popOptions);
    const document = await query;

    if (!document) {
      return next(new AppError(404, "No document found with that ID"));
    }
    res.status(200).json({
      status: "success",
      data: document,
    });
  } catch (err) {
    next(err);
  }
};
const updateOne = (Model) => async (req, res, next) => {
  try {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!document) {
      return next(new AppError(404, "No document found with that ID"));
    }

    res.status(200).json({
      status: "success",
      data: {
        document,
      },
    });
  } catch (err) {
    next(err);
  }
};
const deleteOne = (Model) => async (req, res, next) => {
  try {
    const document = await Model.findByIdAndDelete(req.params.id);
    if (!document) {
      return next(new AppError(404, "No document found with that ID"));
    }
    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, createOne, getOne, deleteOne, updateOne };
