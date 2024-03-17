import moment from "moment-timezone"

const today_date_ist = async ()=>{
    return moment()
            .tz("Asia/Kolkata")
            .format("YYYY-MM-DD HH:mm:ss")

}

export {
    today_date_ist
}